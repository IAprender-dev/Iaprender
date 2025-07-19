import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ChangePasswordCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminGetUserCommand,
  AdminDeleteUserCommand,
  AdminUpdateUserAttributesCommand,
  ListUsersCommand,
  GlobalSignOutCommand,
  AdminUserGlobalSignOutCommand,
  GetUserCommand,
  AuthFlowType,
  ChallengeNameType
} from '@aws-sdk/client-cognito-identity-provider';
import { createHmac } from 'crypto';
import { envConfig } from '../config/environment';
import { Logger } from '../utils/logger';
import { MetricsCollector, getMetrics } from '../utils/metrics';
import { AppErrors } from '../middleware/errorHandler';
import { Cache } from '../utils/cache';

interface AuthResult {
  userId: string;
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  challengeName?: ChallengeNameType;
  session?: string;
  groups?: string[];
  attributes?: Record<string, string>;
}

interface TokenExchangeResult {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  groups: string[];
  attributes: Record<string, string>;
  status: string;
}

export class CognitoAuthService {
  private client: CognitoIdentityProviderClient;
  private logger: Logger;
  private metrics: MetricsCollector;
  private cache: Cache;
  private userPoolId: string;
  private clientId: string;
  private clientSecret?: string;
  private region: string;

  constructor() {
    this.region = envConfig.cognito.region;
    this.client = new CognitoIdentityProviderClient({
      region: this.region,
      maxAttempts: 3,
      retryMode: 'adaptive'
    });
    
    this.logger = new Logger('CognitoAuthService');
    this.metrics = getMetrics();
    this.cache = new Cache('cognito', 300); // 5 minutes cache
    
    this.userPoolId = envConfig.cognito.userPoolId!;
    this.clientId = envConfig.cognito.clientId!;
    this.clientSecret = envConfig.security.cognitoClientSecret;
    
    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    const missing = [];
    if (!this.userPoolId) missing.push('userPoolId');
    if (!this.clientId) missing.push('clientId');
    if (!this.region) missing.push('region');
    
    if (missing.length > 0) {
      throw new Error(`Missing Cognito configuration: ${missing.join(', ')}`);
    }
  }

  public async authenticate(
    username: string, 
    password: string,
    authFlow: AuthFlowType = 'USER_PASSWORD_AUTH'
  ): Promise<AuthResult> {
    const timer = this.metrics.startTimer();
    
    try {
      this.logger.info('Authentication attempt', { username, authFlow });
      
      const authParameters: Record<string, string> = {
        USERNAME: username,
        PASSWORD: password
      };
      
      // Add SECRET_HASH if client secret is configured
      if (this.clientSecret) {
        authParameters.SECRET_HASH = this.calculateSecretHash(username);
      }
      
      const command = new InitiateAuthCommand({
        ClientId: this.clientId,
        AuthFlow: authFlow,
        AuthParameters: authParameters
      });

      const response = await this.client.send(command);
      
      // Handle authentication challenges
      if (response.ChallengeName) {
        this.logger.info('Authentication challenge received', { 
          username, 
          challenge: response.ChallengeName 
        });
        
        return {
          userId: username,
          challengeName: response.ChallengeName,
          session: response.Session
        };
      }

      if (!response.AuthenticationResult) {
        throw AppErrors.unauthorized('Authentication failed');
      }

      // Extract user data from tokens
      const userData = await this.getUserDataFromToken(
        response.AuthenticationResult.AccessToken!
      );

      const duration = timer();
      this.logger.info('Authentication successful', { username, duration });
      this.metrics.timing('cognito.authenticate.duration', duration);
      this.metrics.increment('cognito.authenticate.success');

      return {
        userId: userData.id,
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
        groups: userData.groups,
        attributes: userData.attributes
      };

    } catch (error: any) {
      const duration = timer();
      this.logger.error('Authentication failed', error, { username, duration });
      this.metrics.increment('cognito.authenticate.failure', { 
        reason: error.name || 'unknown' 
      });
      
      // Map Cognito errors to user-friendly messages
      throw this.mapCognitoError(error);
    }
  }

  public async respondToAuthChallenge(
    challengeName: ChallengeNameType,
    session: string,
    challengeResponses: Record<string, string>
  ): Promise<AuthResult> {
    const timer = this.metrics.startTimer();
    
    try {
      // Add SECRET_HASH if needed
      if (this.clientSecret && challengeResponses.USERNAME) {
        challengeResponses.SECRET_HASH = this.calculateSecretHash(
          challengeResponses.USERNAME
        );
      }

      const command = new RespondToAuthChallengeCommand({
        ClientId: this.clientId,
        ChallengeName: challengeName,
        Session: session,
        ChallengeResponses: challengeResponses
      });

      const response = await this.client.send(command);
      
      // Check for additional challenges
      if (response.ChallengeName) {
        return {
          userId: challengeResponses.USERNAME || '',
          challengeName: response.ChallengeName,
          session: response.Session
        };
      }

      if (!response.AuthenticationResult) {
        throw AppErrors.unauthorized('Challenge response failed');
      }

      const userData = await this.getUserDataFromToken(
        response.AuthenticationResult.AccessToken!
      );

      const duration = timer();
      this.metrics.timing('cognito.challenge_response.duration', duration);

      return {
        userId: userData.id,
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
        groups: userData.groups,
        attributes: userData.attributes
      };

    } catch (error) {
      this.logger.error('Challenge response failed', error);
      throw this.mapCognitoError(error);
    }
  }

  public async createUser(params: {
    email: string;
    name: string;
    temporaryPassword: string;
    group?: string;
    attributes?: Record<string, string>;
    sendEmail?: boolean;
  }): Promise<{ userId: string; tempPassword: string }> {
    const timer = this.metrics.startTimer();
    
    try {
      const userAttributes = [
        { Name: 'email', Value: params.email },
        { Name: 'name', Value: params.name },
        { Name: 'email_verified', Value: 'true' }
      ];

      // Add custom attributes
      if (params.attributes) {
        Object.entries(params.attributes).forEach(([name, value]) => {
          userAttributes.push({ Name: name, Value: value });
        });
      }

      const command = new AdminCreateUserCommand({
        UserPoolId: this.userPoolId,
        Username: params.email,
        UserAttributes: userAttributes,
        TemporaryPassword: params.temporaryPassword,
        MessageAction: params.sendEmail ? 'RESEND' : 'SUPPRESS',
        DesiredDeliveryMediums: ['EMAIL']
      });

      const response = await this.client.send(command);
      
      // Add user to group if specified
      if (params.group) {
        await this.addUserToGroup(params.email, params.group);
      }

      const duration = timer();
      this.logger.info('User created successfully', { 
        email: params.email, 
        duration 
      });
      this.metrics.timing('cognito.create_user.duration', duration);
      this.metrics.increment('cognito.create_user.success');

      return {
        userId: response.User!.Username!,
        tempPassword: params.temporaryPassword
      };

    } catch (error) {
      this.logger.error('Create user failed', error);
      this.metrics.increment('cognito.create_user.failure');
      throw this.mapCognitoError(error);
    }
  }

  public async deleteUser(username: string): Promise<void> {
    try {
      const command = new AdminDeleteUserCommand({
        UserPoolId: this.userPoolId,
        Username: username
      });

      await this.client.send(command);
      
      // Clear cache
      this.cache.delete(`user:${username}`);
      
      this.logger.info('User deleted', { username });
      this.metrics.increment('cognito.delete_user.success');

    } catch (error) {
      this.logger.error('Delete user failed', error);
      this.metrics.increment('cognito.delete_user.failure');
      throw this.mapCognitoError(error);
    }
  }

  public async updateUserAttributes(
    username: string, 
    attributes: Record<string, string>
  ): Promise<void> {
    try {
      const userAttributes = Object.entries(attributes).map(([Name, Value]) => ({
        Name,
        Value
      }));

      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: this.userPoolId,
        Username: username,
        UserAttributes: userAttributes
      });

      await this.client.send(command);
      
      // Clear cache
      this.cache.delete(`user:${username}`);
      
      this.logger.info('User attributes updated', { username });
      this.metrics.increment('cognito.update_attributes.success');

    } catch (error) {
      this.logger.error('Update attributes failed', error);
      this.metrics.increment('cognito.update_attributes.failure');
      throw this.mapCognitoError(error);
    }
  }

  public async addUserToGroup(username: string, groupName: string): Promise<void> {
    try {
      const command = new AdminAddUserToGroupCommand({
        UserPoolId: this.userPoolId,
        Username: username,
        GroupName: groupName
      });

      await this.client.send(command);
      
      // Clear cache
      this.cache.delete(`user:${username}`);
      
      this.logger.info('User added to group', { username, groupName });
      this.metrics.increment('cognito.add_to_group.success');

    } catch (error) {
      this.logger.error('Add to group failed', error);
      this.metrics.increment('cognito.add_to_group.failure');
      throw this.mapCognitoError(error);
    }
  }

  public async listUsers(params?: {
    limit?: number;
    filter?: string;
    paginationToken?: string;
  }): Promise<{ users: UserData[]; nextToken?: string }> {
    try {
      const command = new ListUsersCommand({
        UserPoolId: this.userPoolId,
        Limit: params?.limit || 60,
        Filter: params?.filter,
        PaginationToken: params?.paginationToken
      });

      const response = await this.client.send(command);
      
      const users = (response.Users || []).map(user => 
        this.parseUserData(user)
      );

      return {
        users,
        nextToken: response.PaginationToken
      };

    } catch (error) {
      this.logger.error('List users failed', error);
      throw this.mapCognitoError(error);
    }
  }

  public async changePassword(
    accessToken: string,
    previousPassword: string,
    proposedPassword: string
  ): Promise<void> {
    try {
      const command = new ChangePasswordCommand({
        AccessToken: accessToken,
        PreviousPassword: previousPassword,
        ProposedPassword: proposedPassword
      });

      await this.client.send(command);
      
      this.logger.info('Password changed successfully');
      this.metrics.increment('cognito.change_password.success');

    } catch (error) {
      this.logger.error('Change password failed', error);
      this.metrics.increment('cognito.change_password.failure');
      throw this.mapCognitoError(error);
    }
  }

  public async forgotPassword(username: string): Promise<void> {
    try {
      const authParameters: any = {
        ClientId: this.clientId,
        Username: username
      };
      
      if (this.clientSecret) {
        authParameters.SecretHash = this.calculateSecretHash(username);
      }

      const command = new ForgotPasswordCommand(authParameters);
      await this.client.send(command);
      
      this.logger.info('Password reset initiated', { username });
      this.metrics.increment('cognito.forgot_password.success');

    } catch (error) {
      this.logger.error('Forgot password failed', error);
      this.metrics.increment('cognito.forgot_password.failure');
      throw this.mapCognitoError(error);
    }
  }

  public async confirmForgotPassword(
    username: string,
    code: string,
    newPassword: string
  ): Promise<void> {
    try {
      const authParameters: any = {
        ClientId: this.clientId,
        Username: username,
        ConfirmationCode: code,
        Password: newPassword
      };
      
      if (this.clientSecret) {
        authParameters.SecretHash = this.calculateSecretHash(username);
      }

      const command = new ConfirmForgotPasswordCommand(authParameters);
      await this.client.send(command);
      
      this.logger.info('Password reset completed', { username });
      this.metrics.increment('cognito.reset_password.success');

    } catch (error) {
      this.logger.error('Reset password failed', error);
      this.metrics.increment('cognito.reset_password.failure');
      throw this.mapCognitoError(error);
    }
  }

  public async globalSignOut(accessToken: string): Promise<void> {
    try {
      const command = new GlobalSignOutCommand({
        AccessToken: accessToken
      });

      await this.client.send(command);
      
      this.logger.info('Global sign out successful');
      this.metrics.increment('cognito.signout.success');

    } catch (error) {
      this.logger.error('Global sign out failed', error);
      this.metrics.increment('cognito.signout.failure');
      // Don't throw - logout should always succeed
    }
  }

  public async exchangeCodeForTokens(code: string): Promise<TokenExchangeResult> {
    const domain = process.env.AWS_COGNITO_DOMAIN;
    const redirectUri = process.env.AWS_COGNITO_REDIRECT_URI;
    
    if (!domain || !redirectUri) {
      throw AppErrors.internal('Cognito OAuth configuration missing');
    }

    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        redirect_uri: redirectUri,
        code
      });

      if (this.clientSecret) {
        params.append('client_secret', this.clientSecret);
      }

      const response = await fetch(`https://${domain}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token exchange failed: ${error}`);
      }

      const tokens = await response.json();
      
      this.metrics.increment('cognito.token_exchange.success');
      
      return tokens;

    } catch (error) {
      this.logger.error('Token exchange failed', error);
      this.metrics.increment('cognito.token_exchange.failure');
      throw error;
    }
  }

  private async getUserDataFromToken(accessToken: string): Promise<UserData> {
    // Check cache first
    const cacheKey = `token:${accessToken.substring(0, 20)}`;
    const cached = this.cache.get<UserData>(cacheKey);
    if (cached) return cached;

    try {
      const command = new GetUserCommand({
        AccessToken: accessToken
      });

      const response = await this.client.send(command);
      const userData = this.parseUserResponse(response);
      
      // Cache the result
      this.cache.set(cacheKey, userData);
      
      return userData;

    } catch (error) {
      this.logger.error('Get user data failed', error);
      throw error;
    }
  }

  private parseUserResponse(response: any): UserData {
    const attributes: Record<string, string> = {};
    let email = '';
    let name = '';
    
    (response.UserAttributes || []).forEach((attr: any) => {
      attributes[attr.Name] = attr.Value;
      
      if (attr.Name === 'email') email = attr.Value;
      if (attr.Name === 'name') name = attr.Value;
    });

    // Extract groups from token or attributes
    const groups = this.extractGroups(response);

    return {
      id: response.Username,
      email,
      name,
      groups,
      attributes,
      status: response.UserStatus || 'UNKNOWN'
    };
  }

  private parseUserData(user: any): UserData {
    const attributes: Record<string, string> = {};
    let email = '';
    let name = '';
    
    (user.Attributes || []).forEach((attr: any) => {
      attributes[attr.Name] = attr.Value;
      
      if (attr.Name === 'email') email = attr.Value;
      if (attr.Name === 'name') name = attr.Value;
    });

    return {
      id: user.Username,
      email,
      name,
      groups: [],
      attributes,
      status: user.UserStatus || 'UNKNOWN'
    };
  }

  private extractGroups(response: any): string[] {
    // Try to get groups from cognito:groups attribute
    const groupsAttr = response.UserAttributes?.find(
      (attr: any) => attr.Name === 'cognito:groups'
    );
    
    if (groupsAttr?.Value) {
      try {
        return JSON.parse(groupsAttr.Value);
      } catch {
        return groupsAttr.Value.split(',').map((g: string) => g.trim());
      }
    }
    
    return [];
  }

  private calculateSecretHash(username: string): string {
    if (!this.clientSecret) {
      throw new Error('Client secret not configured');
    }

    const message = username + this.clientId;
    const hmac = createHmac('sha256', this.clientSecret);
    hmac.update(message);
    return hmac.digest('base64');
  }

  private mapCognitoError(error: any): Error {
    const errorMap: Record<string, string> = {
      'NotAuthorizedException': 'Invalid credentials',
      'UserNotFoundException': 'User not found',
      'UserNotConfirmedException': 'User not confirmed. Please verify your email',
      'PasswordResetRequiredException': 'Password reset required',
      'TooManyRequestsException': 'Too many attempts. Please try again later',
      'InvalidPasswordException': 'Password does not meet requirements',
      'UsernameExistsException': 'User already exists',
      'CodeMismatchException': 'Invalid verification code',
      'ExpiredCodeException': 'Verification code has expired',
      'LimitExceededException': 'Request limit exceeded',
      'InvalidParameterException': 'Invalid parameters provided'
    };

    const message = errorMap[error.name] || error.message || 'Authentication error';
    
    if (error.name === 'NotAuthorizedException' || error.name === 'UserNotFoundException') {
      return AppErrors.unauthorized(message);
    }
    
    if (error.name === 'TooManyRequestsException' || error.name === 'LimitExceededException') {
      return AppErrors.tooManyRequests(message);
    }
    
    if (error.name === 'InvalidParameterException' || error.name === 'InvalidPasswordException') {
      return AppErrors.badRequest(message);
    }
    
    if (error.name === 'UsernameExistsException') {
      return AppErrors.conflict(message);
    }
    
    return AppErrors.internal(message);
  }

  public decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      const payload = parts[1];
      const decoded = Buffer.from(payload, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch (error) {
      this.logger.error('Token decode failed', error);
      throw AppErrors.badRequest('Invalid token');
    }
  }
}
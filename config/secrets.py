import os
from typing import Dict, Optional

class SecretsManager:
    """
    Gerenciador centralizado de credenciais e configurações sensíveis
    para o sistema IAverse com integração AWS Cognito
    """
    
    @staticmethod
    def get_aws_credentials() -> Dict[str, Optional[str]]:
        """
        Recupera credenciais AWS necessárias para autenticação e serviços
        
        Returns:
            Dict contendo todas as credenciais AWS necessárias
        """
        return {
            'region': os.environ.get('AWS_REGION', 'us-east-1'),
            'cognito_user_pool_id': os.environ.get('COGNITO_USER_POOL_ID'),
            'cognito_client_id': os.environ.get('COGNITO_CLIENT_ID'),
            'cognito_client_secret': os.environ.get('COGNITO_CLIENT_SECRET'),
            'cognito_domain': os.environ.get('COGNITO_DOMAIN'),
            'cognito_redirect_uri': os.environ.get('COGNITO_REDIRECT_URI'),
            'access_key': os.environ.get('AWS_ACCESS_KEY_ID'),
            'secret_key': os.environ.get('AWS_SECRET_ACCESS_KEY')
        }
    
    @staticmethod
    def get_database_credentials() -> Dict[str, Optional[str]]:
        """
        Recupera credenciais do banco de dados PostgreSQL
        
        Returns:
            Dict contendo configurações de conexão do banco
        """
        return {
            'database_url': os.environ.get('DATABASE_URL'),
            'pghost': os.environ.get('PGHOST'),
            'pgport': os.environ.get('PGPORT', '5432'),
            'pguser': os.environ.get('PGUSER'),
            'pgpassword': os.environ.get('PGPASSWORD'),
            'pgdatabase': os.environ.get('PGDATABASE')
        }
    
    @staticmethod
    def get_ai_api_keys() -> Dict[str, Optional[str]]:
        """
        Recupera chaves de API para serviços de IA integrados
        
        Returns:
            Dict contendo chaves de API dos serviços de IA
        """
        return {
            'openai_api_key': os.environ.get('OPENAI_API_KEY'),
            'anthropic_api_key': os.environ.get('ANTHROPIC_API_KEY'),
            'perplexity_api_key': os.environ.get('PERPLEXITY_API_KEY'),
            'litellm_api_key': os.environ.get('LITELLM_API_KEY')
        }
    
    @staticmethod
    def get_jwt_secrets() -> Dict[str, Optional[str]]:
        """
        Recupera segredos para autenticação JWT
        
        Returns:
            Dict contendo configurações JWT
        """
        return {
            'jwt_secret': os.environ.get('JWT_SECRET', 'test_secret_key_iaprender_2025'),
            'jwt_algorithm': os.environ.get('JWT_ALGORITHM', 'HS256'),
            'jwt_expiration': os.environ.get('JWT_EXPIRATION', '24h')
        }
    
    @staticmethod
    def get_email_credentials() -> Dict[str, Optional[str]]:
        """
        Recupera credenciais para serviços de email
        
        Returns:
            Dict contendo configurações de email
        """
        return {
            'sendgrid_api_key': os.environ.get('SENDGRID_API_KEY'),
            'smtp_host': os.environ.get('SMTP_HOST'),
            'smtp_port': os.environ.get('SMTP_PORT', '587'),
            'smtp_user': os.environ.get('SMTP_USER'),
            'smtp_password': os.environ.get('SMTP_PASSWORD')
        }
    
    @staticmethod
    def get_application_config() -> Dict[str, Optional[str]]:
        """
        Recupera configurações gerais da aplicação
        
        Returns:
            Dict contendo configurações da aplicação
        """
        return {
            'environment': os.environ.get('NODE_ENV', 'development'),
            'port': os.environ.get('PORT', '5000'),
            'frontend_url': os.environ.get('FRONTEND_URL', 'http://localhost:3000'),
            'backend_url': os.environ.get('BACKEND_URL', 'http://localhost:5000'),
            'replit_domain': os.environ.get('REPLIT_DOMAINS', ''),
            'debug_mode': os.environ.get('DEBUG', 'false').lower() == 'true'
        }
    
    @staticmethod
    def validate_aws_credentials() -> tuple[bool, list[str]]:
        """
        Valida se todas as credenciais AWS necessárias estão presentes
        
        Returns:
            Tuple (is_valid, missing_credentials)
        """
        aws_creds = SecretsManager.get_aws_credentials()
        required_keys = [
            'cognito_user_pool_id',
            'cognito_client_id',
            'cognito_domain',
            'cognito_redirect_uri'
        ]
        
        missing = [key for key in required_keys if not aws_creds.get(key)]
        return len(missing) == 0, missing
    
    @staticmethod
    def validate_database_credentials() -> tuple[bool, list[str]]:
        """
        Valida se as credenciais do banco de dados estão presentes
        
        Returns:
            Tuple (is_valid, missing_credentials)
        """
        db_creds = SecretsManager.get_database_credentials()
        required_keys = ['database_url']
        
        missing = [key for key in required_keys if not db_creds.get(key)]
        return len(missing) == 0, missing
    
    @staticmethod
    def get_all_secrets() -> Dict[str, Dict[str, Optional[str]]]:
        """
        Recupera todas as configurações organizadas por categoria
        
        Returns:
            Dict contendo todas as configurações categorizadas
        """
        return {
            'aws': SecretsManager.get_aws_credentials(),
            'database': SecretsManager.get_database_credentials(),
            'ai_apis': SecretsManager.get_ai_api_keys(),
            'jwt': SecretsManager.get_jwt_secrets(),
            'email': SecretsManager.get_email_credentials(),
            'application': SecretsManager.get_application_config()
        }
    
    @staticmethod
    def check_system_health() -> Dict[str, any]:
        """
        Verifica a saúde do sistema de credenciais
        
        Returns:
            Dict contendo status de cada categoria de credenciais
        """
        aws_valid, aws_missing = SecretsManager.validate_aws_credentials()
        db_valid, db_missing = SecretsManager.validate_database_credentials()
        
        ai_creds = SecretsManager.get_ai_api_keys()
        ai_keys_present = sum(1 for key in ai_creds.values() if key)
        
        return {
            'aws_cognito': {
                'status': 'ok' if aws_valid else 'error',
                'missing_credentials': aws_missing
            },
            'database': {
                'status': 'ok' if db_valid else 'error',
                'missing_credentials': db_missing
            },
            'ai_services': {
                'status': 'ok' if ai_keys_present > 0 else 'warning',
                'available_services': ai_keys_present,
                'total_services': len(ai_creds)
            },
            'overall_status': 'healthy' if aws_valid and db_valid else 'needs_attention'
        }


# Exemplo de uso e testes
if __name__ == "__main__":
    # Teste das funcionalidades
    print("=== TESTE DO SISTEMA DE CREDENCIAIS ===")
    
    # Verificar saúde do sistema
    health = SecretsManager.check_system_health()
    print(f"Status geral: {health['overall_status']}")
    
    # Verificar AWS
    aws_valid, aws_missing = SecretsManager.validate_aws_credentials()
    print(f"AWS Cognito: {'✅' if aws_valid else '❌'}")
    if aws_missing:
        print(f"  Credenciais faltantes: {', '.join(aws_missing)}")
    
    # Verificar Database
    db_valid, db_missing = SecretsManager.validate_database_credentials()
    print(f"Database: {'✅' if db_valid else '❌'}")
    if db_missing:
        print(f"  Credenciais faltantes: {', '.join(db_missing)}")
    
    # Mostrar configuração da aplicação
    app_config = SecretsManager.get_application_config()
    print(f"Ambiente: {app_config['environment']}")
    print(f"Porta: {app_config['port']}")
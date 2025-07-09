// Base model class with common database operations

const { pool } = require('../config/database');
const logger = require('../utils/logger');

class BaseModel {
  static tableName = '';
  
  // Execute a SQL query
  static async query(sql, params = []) {
    const client = await pool.connect();
    try {
      logger.db.query(sql, params);
      const result = await client.query(sql, params);
      return result;
    } catch (error) {
      logger.db.error(error, sql);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Find all records
  static async findAll(conditions = {}, orderBy = 'id ASC') {
    let sql = `SELECT * FROM ${this.tableName}`;
    const params = [];
    
    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(' AND ');
      sql += ` WHERE ${whereClause}`;
      params.push(...Object.values(conditions));
    }
    
    sql += ` ORDER BY ${orderBy}`;
    
    const result = await this.query(sql, params);
    return result.rows;
  }
  
  // Find one record by ID
  static async findById(id) {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.query(sql, [id]);
    return result.rows[0] || null;
  }
  
  // Create a new record
  static async create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    
    const sql = `
      INSERT INTO ${this.tableName} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.query(sql, values);
    return result.rows[0];
  }
  
  // Update a record by ID
  static async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
    
    const sql = `
      UPDATE ${this.tableName}
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await this.query(sql, [id, ...values]);
    return result.rows[0];
  }
  
  // Delete a record by ID
  static async delete(id) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
    const result = await this.query(sql, [id]);
    return result.rows[0];
  }
  
  // Count records
  static async count(conditions = {}) {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params = [];
    
    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(' AND ');
      sql += ` WHERE ${whereClause}`;
      params.push(...Object.values(conditions));
    }
    
    const result = await this.query(sql, params);
    return parseInt(result.rows[0].count);
  }
  
  // Check if record exists
  static async exists(conditions) {
    const count = await this.count(conditions);
    return count > 0;
  }
}

module.exports = BaseModel;
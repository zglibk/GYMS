import mysql from 'mysql2/promise';

/**
 * MySQL数据库连接配置
 * 连接到远程MySQL 8.0服务器
 */
const config = {
    host: '120.77.9.130',
    port: 3306,
    user: 'root',
    password: 'Qa369*',
    database: 'apartment_cleaning',
    charset: 'utf8mb4',
    timezone: '+08:00',
    acquireTimeout: 60000,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 900000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200
};

/**
 * MySQL数据库连接管理类
 * 提供连接池管理和查询方法
 */
class Database {
    constructor() {
        this.pool = null;
    }

    /**
     * 创建数据库连接池
     * @returns {Promise<mysql.Pool>} 数据库连接池
     */
    async connect() {
        try {
            if (!this.pool) {
                this.pool = mysql.createPool(config);
                console.log('MySQL数据库连接池创建成功');
                console.log(`连接到: ${config.host}:${config.port}/${config.database}`);
                
                // 测试连接
                const connection = await this.pool.getConnection();
                await connection.ping();
                connection.release();
                console.log('数据库连接测试成功');
            }
            return this.pool;
        } catch (error) {
            console.error('数据库连接失败:', error);
            throw error;
        }
    }

    /**
     * 执行SQL查询
     * @param {string} sqlString - SQL查询语句
     * @param {Array} params - 查询参数数组
     * @returns {Promise<Array>} 查询结果
     */
    async query(sqlString, params = []) {
        try {
            const pool = await this.connect();
            // 对于包含LIMIT/OFFSET的查询，使用query方法而不是execute
            if (sqlString.includes('LIMIT') || sqlString.includes('OFFSET')) {
                const [rows] = await pool.query(sqlString, params);
                return rows;
            } else {
                const [rows] = await pool.execute(sqlString, params);
                return rows;
            }
        } catch (error) {
            console.error('数据库查询失败:', error);
            console.error('SQL:', sqlString);
            console.error('参数:', params);
            throw error;
        }
    }

    /**
     * 执行事务
     * @param {Function} callback - 事务回调函数
     * @returns {Promise<any>} 事务结果
     */
    async transaction(callback) {
        const pool = await this.connect();
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * 关闭数据库连接池
     */
    async close() {
        try {
            if (this.pool) {
                await this.pool.end();
                this.pool = null;
                console.log('MySQL数据库连接池已关闭');
            }
        } catch (error) {
            console.error('关闭数据库连接池失败:', error);
        }
    }

    /**
     * 获取连接池状态
     * @returns {Object} 连接池状态信息
     */
    getPoolStatus() {
        if (!this.pool) {
            return { status: 'disconnected' };
        }
        
        return {
            status: 'connected',
            config: {
                host: config.host,
                port: config.port,
                database: config.database,
                user: config.user
            }
        };
    }
}

const database = new Database();

// 优雅关闭
process.on('SIGINT', async () => {
    await database.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await database.close();
    process.exit(0);
});

export default database;
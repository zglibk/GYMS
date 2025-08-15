import sql from 'mssql';

const config = {
    user: 'sa',
    password: 'Qa369*',
    server: 'localhost',
    database: 'GYMS',
    options: {
        encrypt: false, // SQL Server 2008R2不需要加密
        trustServerCertificate: true,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

class Database {
    constructor() {
        this.pool = null;
    }

    async connect() {
        try {
            if (!this.pool) {
                this.pool = await sql.connect(config);
                console.log('数据库连接成功');
            }
            return this.pool;
        } catch (error) {
            console.error('数据库连接失败:', error);
            throw error;
        }
    }

    async query(sqlString, params = {}) {
        try {
            const pool = await this.connect();
            const request = pool.request();
            
            // 添加参数
            Object.keys(params).forEach(key => {
                request.input(key, params[key]);
            });
            
            const result = await request.query(sqlString);
            return result;
        } catch (error) {
            console.error('数据库查询错误:', error);
            throw error;
        }
    }

    async close() {
        try {
            if (this.pool) {
                await this.pool.close();
                this.pool = null;
                console.log('数据库连接已关闭');
            }
        } catch (error) {
            console.error('关闭数据库连接错误:', error);
        }
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
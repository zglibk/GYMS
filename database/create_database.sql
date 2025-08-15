-- 公寓房间清洁管理系统数据库脚本
-- 数据库：GYMS
-- SQL Server 2008R2

USE master;
GO

-- 创建数据库
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'GYMS')
BEGIN
    CREATE DATABASE GYMS;
END
GO

USE GYMS;
GO

-- 创建用户表
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
BEGIN
    CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(50) NOT NULL UNIQUE,
        password NVARCHAR(255) NOT NULL,
        email NVARCHAR(100),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- 创建房号表
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='rooms' AND xtype='U')
BEGIN
    CREATE TABLE rooms (
        id INT IDENTITY(1,1) PRIMARY KEY,
        room_number NVARCHAR(20) NOT NULL UNIQUE, -- 房号，如：101, 102, 201等
        floor_number INT NOT NULL, -- 楼层号
        room_type NVARCHAR(20) NOT NULL, -- 房间类型：双床、大床、三床等
        status NVARCHAR(20) DEFAULT '可用', -- 房间状态：可用、维修中、停用等
        remarks NVARCHAR(500), -- 备注信息
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- 创建清洁记录表
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='cleaning_records' AND xtype='U')
BEGIN
    CREATE TABLE cleaning_records (
        id INT IDENTITY(1,1) PRIMARY KEY,
        date DATE NOT NULL,
        type NVARCHAR(50) NOT NULL,
        room_numbers NVARCHAR(500) NOT NULL, -- 支持多个房号，用逗号分隔
        room_count INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        remarks NVARCHAR(1000),
        created_by INT,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (created_by) REFERENCES users(id)
    );
END
GO

-- 插入默认管理员用户
-- 密码：admin123 (已加密)
IF NOT EXISTS (SELECT * FROM users WHERE username = 'admin')
BEGIN
    INSERT INTO users (username, password, email) 
    VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@apartment.com');
END
GO

-- 插入示例房号数据
IF NOT EXISTS (SELECT * FROM rooms WHERE room_number = '101')
BEGIN
    INSERT INTO rooms (room_number, floor_number, room_type, status) VALUES
    ('101', 1, '双床', '可用'),
    ('102', 1, '大床', '可用'),
    ('103', 1, '三床', '可用'),
    ('104', 1, '双床', '可用'),
    ('105', 1, '大床', '可用'),
    ('201', 2, '双床', '可用'),
    ('202', 2, '大床', '可用'),
    ('203', 2, '三床', '可用'),
    ('204', 2, '双床', '可用'),
    ('205', 2, '大床', '可用'),
    ('301', 3, '双床', '可用'),
    ('302', 3, '大床', '可用'),
    ('303', 3, '三床', '可用'),
    ('304', 3, '双床', '可用'),
    ('305', 3, '大床', '可用');
END
GO

-- 创建索引
CREATE INDEX IX_rooms_floor_number ON rooms(floor_number);
CREATE INDEX IX_rooms_room_type ON rooms(room_type);
CREATE INDEX IX_rooms_status ON rooms(status);
CREATE INDEX IX_cleaning_records_date ON cleaning_records(date);
CREATE INDEX IX_cleaning_records_type ON cleaning_records(type);
CREATE INDEX IX_cleaning_records_created_by ON cleaning_records(created_by);
GO

PRINT '数据库GYMS创建完成！';
PRINT '默认管理员账号：admin';
PRINT '默认密码：admin123';
GO
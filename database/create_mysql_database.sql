-- 公寓房间清洁管理系统数据库脚本
-- 数据库：apartment_cleaning
-- MySQL 8.0

-- 创建数据库
CREATE DATABASE IF NOT EXISTS apartment_cleaning
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE apartment_cleaning;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建房号表
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL UNIQUE COMMENT '房号，如：101, 102, 201等',
    floor_number INT NOT NULL COMMENT '楼层号',
    room_type VARCHAR(20) NOT NULL COMMENT '房间类型：双床、大床、三床等',
    status VARCHAR(20) DEFAULT '可用' COMMENT '房间状态：可用、维修中、停用等',
    remarks TEXT COMMENT '备注信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建清洁记录表
CREATE TABLE IF NOT EXISTS cleaning_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL,
    room_numbers TEXT NOT NULL COMMENT '支持多个房号，用逗号分隔',
    room_count INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    remarks TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 插入默认管理员用户
-- 密码：admin123 (已加密)
INSERT IGNORE INTO users (username, password, email) 
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@apartment.com');

-- 插入示例房号数据
INSERT IGNORE INTO rooms (room_number, floor_number, room_type, status) VALUES
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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_rooms_floor_number ON rooms(floor_number);
CREATE INDEX IF NOT EXISTS idx_rooms_room_type ON rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_cleaning_records_date ON cleaning_records(date);
CREATE INDEX IF NOT EXISTS idx_cleaning_records_type ON cleaning_records(type);
CREATE INDEX IF NOT EXISTS idx_cleaning_records_created_by ON cleaning_records(created_by);

SELECT '数据库apartment_cleaning创建完成！' AS message;
SELECT '默认管理员账号：admin' AS admin_info;
SELECT '默认密码：admin123' AS password_info;
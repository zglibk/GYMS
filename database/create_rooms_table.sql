-- 创建房号表
CREATE TABLE rooms (
    id INT IDENTITY(1,1) NOT NULL,
    room_number NVARCHAR(20) NOT NULL,
    floor_number INT NOT NULL,
    room_type NVARCHAR(20) NOT NULL,
    status NVARCHAR(20) DEFAULT N'可用',
    remarks NVARCHAR(500),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT PK_rooms PRIMARY KEY (id),
    CONSTRAINT UQ_rooms_room_number UNIQUE (room_number)
);

-- 插入示例数据
INSERT INTO rooms (room_number, floor_number, room_type, status) VALUES
('101', 1, N'双床', N'可用'),
('102', 1, N'大床', N'可用'),
('103', 1, N'三床', N'可用'),
('104', 1, N'双床', N'可用'),
('105', 1, N'大床', N'可用'),
('201', 2, N'双床', N'可用'),
('202', 2, N'大床', N'可用'),
('203', 2, N'三床', N'可用'),
('204', 2, N'双床', N'可用'),
('205', 2, N'大床', N'可用'),
('301', 3, N'双床', N'可用'),
('302', 3, N'大床', N'可用'),
('303', 3, N'三床', N'可用'),
('304', 3, N'双床', N'可用'),
('305', 3, N'大床', N'可用');

-- 创建索引
CREATE INDEX IX_rooms_floor_number ON rooms(floor_number);
CREATE INDEX IX_rooms_room_type ON rooms(room_type);
CREATE INDEX IX_rooms_status ON rooms(status);
USE master;
GO

-- 1. XÓA DATABASE NẾU ĐÃ TỒN TẠI VÀ TẠO MỚI (LÀM SẠCH MÔI TRƯỜNG)
IF DB_ID('HotelManagementDB') IS NOT NULL
BEGIN
    ALTER DATABASE HotelManagementDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE HotelManagementDB;
END
GO

CREATE DATABASE HotelManagementDB;
GO

USE HotelManagementDB;
GO

-- ==============================================================================
-- PHẦN 1: TẠO CÁC BẢNG 
-- ==============================================================================
CREATE TABLE [dbo].[Roles] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [name] NVARCHAR(100) NOT NULL,
    [description] NVARCHAR(MAX) NULL,
    [created_at] DATETIME DEFAULT GETDATE(),
    [created_by] INT NULL,
    [updated_at] DATETIME NULL,
    [updated_by] INT NULL
);
GO
CREATE TABLE [dbo].[Permissions] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [name] NVARCHAR(100) NOT NULL,
    [created_at] DATETIME DEFAULT GETDATE(),
    [created_by] INT NULL,
    [updated_at] DATETIME NULL,
    [updated_by] INT NULL
);
GO
CREATE TABLE [dbo].[Role_Permissions] (
    [role_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Roles](id),
    [permission_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Permissions](id),
    [created_at] DATETIME DEFAULT GETDATE(),
    [created_by] INT NULL,
    [updated_at] DATETIME NULL,
    [updated_by] INT NULL,
    PRIMARY KEY CLUSTERED ([role_id], [permission_id])
);
GO
CREATE TABLE [dbo].[Memberships] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [tier_name] NVARCHAR(100) NOT NULL,
    [min_points] INT DEFAULT 0,
    [discount_percent] DECIMAL(5, 2) DEFAULT 0.00
);
GO
CREATE TABLE [dbo].[Users] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [role_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Roles](id),
    [membership_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Memberships](id),
    [full_name] NVARCHAR(255) NOT NULL,
    [email] NVARCHAR(255) NOT NULL UNIQUE,
    [phone] NVARCHAR(50) NULL,
    [password_hash] NVARCHAR(MAX) NOT NULL,
    [avatar_url] NVARCHAR(500) NULL,      
    [date_of_birth] DATE NULL,
    [gender] NVARCHAR(50) NULL,
    [address] NVARCHAR(MAX) NULL,
    [refresh_token] VARCHAR(255) NULL,    
    [refresh_token_expiry] DATETIME NULL,
    [total_points] INT NOT NULL DEFAULT 0,
    [last_activity_date] DATETIME DEFAULT GETDATE(),
    [status] BIT DEFAULT 1,
    [is_active] BIT NOT NULL DEFAULT 1,
    [created_at] DATETIME DEFAULT GETDATE(),
    [created_by] INT NULL,
    [updated_at] DATETIME NULL,
    [updated_by] INT NULL
);
GO
CREATE NONCLUSTERED INDEX [IX_Users_RefreshToken] ON [dbo].[Users] ([refresh_token]);
GO
-- Các bảng quản lý vật tư
CREATE TABLE [dbo].[Amenities] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [name] NVARCHAR(255) NOT NULL,
    [icon_url] NVARCHAR(MAX) NULL,
    [is_active] BIT NOT NULL DEFAULT 1
);
GO
CREATE TABLE [dbo].[Equipments] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [item_code] VARCHAR(50) NOT NULL UNIQUE,
    [name] NVARCHAR(255) NOT NULL,
    [category] NVARCHAR(100) NOT NULL,
    [unit] NVARCHAR(50) NOT NULL,
    [total_quantity] INT NOT NULL DEFAULT 0,
    [in_use_quantity] INT NOT NULL DEFAULT 0,
    [damaged_quantity] INT NOT NULL DEFAULT 0,
    [liquidated_quantity] INT NOT NULL DEFAULT 0,
    [in_stock_quantity] AS ([total_quantity] - [in_use_quantity] - [damaged_quantity] - [liquidated_quantity]),
    [base_price] DECIMAL(18, 2) NOT NULL DEFAULT 0,
    [default_price_if_lost] DECIMAL(18, 2) NOT NULL DEFAULT 0,
    [supplier] NVARCHAR(255) NULL,
    [image_url] NVARCHAR(MAX) NULL,
    [is_active] BIT NOT NULL DEFAULT 1,
    [created_at] DATETIME DEFAULT GETDATE(),
    [created_by] INT NULL,
    [updated_at] DATETIME NULL,
    [updated_by] INT NULL
);
GO
-- Các bảng quản lý phòng
CREATE TABLE [dbo].[Room_Types] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [name] NVARCHAR(255) NOT NULL,
    [base_price] DECIMAL(18, 2) NOT NULL,
    [price_per_hour] DECIMAL(18, 2) NOT NULL DEFAULT 0, 
    [capacity_adults] INT NOT NULL,
    [capacity_children] INT NOT NULL,
    [size_sqm] FLOAT NULL, 
    [bed_type] NVARCHAR(100) NULL, 
    [view_direction] NVARCHAR(100) NULL,
    [description] NVARCHAR(MAX) NULL,
    [is_active] BIT NOT NULL DEFAULT 1,
    [created_at] DATETIME DEFAULT GETDATE(),
    [created_by] INT NULL,
    [updated_at] DATETIME NULL,
    [updated_by] INT NULL
);
GO
CREATE TABLE [dbo].[Rooms] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [room_type_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Room_Types](id),
    [room_number] NVARCHAR(50) NOT NULL,
    [floor] INT NULL,
    [status] NVARCHAR(50) DEFAULT 'Available',
    [cleaning_status] NVARCHAR(50) NOT NULL DEFAULT 'Clean',
    [is_active] BIT NOT NULL DEFAULT 1,
    [created_at] DATETIME DEFAULT GETDATE(),
    [created_by] INT NULL,
    [updated_at] DATETIME NULL,
    [updated_by] INT NULL
);
GO
CREATE TABLE [dbo].[RoomType_Amenities] (
    [room_type_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Room_Types](id),
    [amenity_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Amenities](id),
    PRIMARY KEY CLUSTERED ([room_type_id], [amenity_id])
);
GO
CREATE TABLE [dbo].[Room_Images] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [room_type_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Room_Types](id),
    [image_url] NVARCHAR(MAX) NOT NULL,
    [is_primary] BIT DEFAULT 0,
    [is_active] BIT NOT NULL DEFAULT 1,
    [created_at] DATETIME DEFAULT GETDATE(),
    [created_by] INT NULL,
    [updated_at] DATETIME NULL,
    [updated_by] INT NULL
);
GO
CREATE TABLE [dbo].[Room_Inventory] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [room_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Rooms](id),
    [EquipmentId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Equipments](Id),
    [quantity] INT DEFAULT 1,
    [price_if_lost] DECIMAL(18, 2) DEFAULT 0,
    [note] NVARCHAR(255) NULL, -- Ghi chú thêm
    [is_active] BIT NOT NULL DEFAULT 1,
    [created_at] DATETIME DEFAULT GETDATE(),
    [created_by] INT NULL,
    [updated_at] DATETIME NULL,
    [updated_by] INT NULL
);
GO
-- bảng điểm du lịch
CREATE TABLE [dbo].[Attractions] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [name] NVARCHAR(255) NOT NULL,
    [distance_km] DECIMAL(5, 2) NULL,
    [description] NVARCHAR(MAX) NULL,
    [map_embed_link] NVARCHAR(MAX) NULL,
    [latitude] DECIMAL(10, 8) NULL, 
    [longitude] DECIMAL(11, 8) NULL, 
    [address] NVARCHAR(500) NULL,
    [is_active] BIT NOT NULL DEFAULT 1,
    [created_at] DATETIME DEFAULT GETDATE(),
    [created_by] INT NULL,
    [updated_at] DATETIME NULL,
    [updated_by] INT NULL
);
GO
-- Các bảng bài viết & blog
CREATE TABLE [dbo].[Article_Categories] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [name] NVARCHAR(255) NOT NULL,
    [slug] NVARCHAR(255) NULL,
    [description] NVARCHAR(MAX) NULL,
    [is_active] BIT NOT NULL DEFAULT 1
);
GO
CREATE TABLE [dbo].[Articles] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [category_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Article_Categories](id),
    [author_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Users](id),
    [title] NVARCHAR(MAX) NOT NULL,
    [slug] NVARCHAR(255) NOT NULL UNIQUE,
    [short_description] NVARCHAR(500) NULL,
    [content] NVARCHAR(MAX) NULL,
    [thumbnail_url] NVARCHAR(MAX) NULL,
    [meta_title] NVARCHAR(255) NULL,
    [meta_description] NVARCHAR(500) NULL,
    [view_count] INT NOT NULL DEFAULT 0,
    [published_at] DATETIME NULL,
    [is_active] BIT NOT NULL DEFAULT 1,
    [created_at] DATETIME DEFAULT GETDATE(),
    [created_by] INT NULL,
    [updated_at] DATETIME NULL,
    [updated_by] INT NULL
);
GO
-- Bảng Vouchers
CREATE TABLE [dbo].[Vouchers] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [code] NVARCHAR(50) NOT NULL UNIQUE,
    [discount_type] NVARCHAR(50) NOT NULL,
    [discount_value] DECIMAL(18, 2) NOT NULL,
    [min_booking_value] DECIMAL(18, 2) DEFAULT 0,
    [max_discount_amount] DECIMAL(18, 2) NULL, 
    [room_type_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Room_Types](id),
    [valid_from] DATETIME NULL,
    [valid_to] DATETIME NULL,
    [usage_limit] INT NULL,
    [max_uses_per_user] INT NOT NULL DEFAULT 1,
    [is_active] BIT NOT NULL DEFAULT 1,
    [created_at] DATETIME DEFAULT GETDATE(),
    [created_by] INT NULL,
    [updated_at] DATETIME NULL,
    [updated_by] INT NULL
);
GO
-- Các bảng Booking
CREATE TABLE [dbo].[Bookings] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [user_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Users](id),
    [guest_name] NVARCHAR(255) NULL,
    [guest_phone] NVARCHAR(50) NULL,
    [guest_email] NVARCHAR(255) NULL,
    [identity_number] NVARCHAR(50) NULL, 
    [booking_code] NVARCHAR(50) NOT NULL UNIQUE,
    [voucher_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Vouchers](id),
    [special_requests] NVARCHAR(MAX) NULL,
    [status] NVARCHAR(50) DEFAULT 'Pending',
    [actual_check_in] DATETIME NULL,
    [actual_check_out] DATETIME NULL,
    [cancellation_reason] NVARCHAR(MAX) NULL,
    [created_at] DATETIME DEFAULT GETDATE(),
    [created_by] INT NULL,
    [updated_at] DATETIME NULL,
    [updated_by] INT NULL
);
GO
CREATE TABLE [dbo].[Booking_Details] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [booking_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Bookings](id),
    [room_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Rooms](id),
    [room_type_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Room_Types](id),
    [check_in_date] DATETIME NOT NULL,
    [check_out_date] DATETIME NOT NULL,
    [applied_price] DECIMAL(18, 2) NOT NULL, 
    [price_type] VARCHAR(20) DEFAULT 'NIGHTLY'
);
GO
-- Bảng Review
CREATE TABLE [dbo].[Reviews] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [user_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Users](id),
    [room_type_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Room_Types](id),
	[booking_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Bookings](id),
    [rating] INT CHECK (rating >= 1 AND rating <= 5),
    [comment] NVARCHAR(MAX) NULL,
    [reply_comment] NVARCHAR(MAX) NULL,
    [is_visible] BIT NOT NULL DEFAULT 1,
    [is_active] BIT NOT NULL DEFAULT 1,
    [created_at] DATETIME DEFAULT GETDATE(),
    [created_by] INT NULL,
    [updated_at] DATETIME NULL,
    [updated_by] INT NULL
);
GO
-- Các Bảng dịch vụ
CREATE TABLE [dbo].[Service_Categories] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [name] NVARCHAR(255) NOT NULL
);
GO
CREATE TABLE [dbo].[Services] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [category_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Service_Categories](id),
    [name] NVARCHAR(255) NOT NULL,
    [price] DECIMAL(18, 2) NOT NULL,
    [unit] NVARCHAR(50) NULL,
    [is_active] BIT NOT NULL DEFAULT 1,
    [created_at] DATETIME DEFAULT GETDATE(),
    [created_by] INT NULL,
    [updated_at] DATETIME NULL,
    [updated_by] INT NULL
);
GO
CREATE TABLE [dbo].[Order_Services] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [booking_detail_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Booking_Details](id),
    [order_date] DATETIME DEFAULT GETDATE(),
    [delivery_time] DATETIME NULL,
    [notes] NVARCHAR(MAX) NULL,
    [total_amount] DECIMAL(18, 2) DEFAULT 0,
    [status] NVARCHAR(50) DEFAULT 'Pending',
    [created_at] DATETIME DEFAULT GETDATE(),
    [created_by] INT NULL,
    [updated_at] DATETIME NULL,
    [updated_by] INT NULL
);
GO
CREATE TABLE [dbo].[Order_Service_Details] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [order_service_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Order_Services](id),
    [service_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Services](id),
    [quantity] INT NOT NULL,
    [unit_price] DECIMAL(18, 2) NOT NULL
);
GO
-- các bảng thanh toán
CREATE TABLE [dbo].[Invoices] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [booking_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Bookings](id),
    [total_room_amount] DECIMAL(18, 2) DEFAULT 0,
    [total_service_amount] DECIMAL(18, 2) DEFAULT 0,
    [discount_amount] DECIMAL(18, 2) DEFAULT 0,
    [tax_amount] DECIMAL(18, 2) DEFAULT 0,
    [final_total] DECIMAL(18, 2) DEFAULT 0,
    [status] NVARCHAR(50) DEFAULT 'Unpaid',
    [created_at] DATETIME DEFAULT GETDATE(),
    [created_by] INT NULL,
    [updated_at] DATETIME NULL,
    [updated_by] INT NULL
);
GO
CREATE TABLE [dbo].[Payments] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [invoice_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Invoices](id),
    [payment_method] NVARCHAR(50) NULL,
    [amount_paid] DECIMAL(18, 2) NOT NULL,
    [transaction_code] NVARCHAR(100) NULL,
    [gateway_response] NVARCHAR(MAX) NULL,
    [refund_amount] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [payment_date] DATETIME DEFAULT GETDATE()
);
GO

-- Bảng thất thoát & hư hỏng
CREATE TABLE [dbo].[Loss_And_Damages] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [booking_detail_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Booking_Details](id),
    [room_inventory_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Room_Inventory](id),
    [invoice_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Invoices](id),
    [reported_by] INT NULL FOREIGN KEY REFERENCES [dbo].[Users](id),
    [quantity] INT NOT NULL,
    [penalty_amount] DECIMAL(18, 2) NOT NULL,
    [description] NVARCHAR(MAX) NULL,
	[evidence_image_url] NVARCHAR(500) NULL,
    [issue_type] VARCHAR(50) NOT NULL DEFAULT 'DAMAGE',
    [status] VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    [created_at] DATETIME DEFAULT GETDATE(),
    [created_by] INT NULL,
    [updated_at] DATETIME NULL,
    [updated_by] INT NULL
);
GO
-- bảng điểm thành viên
CREATE TABLE [dbo].[Point_Histories] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [user_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Users](id),
    [invoice_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Invoices](id),
    [points_earned] INT NOT NULL DEFAULT 0,
    [points_redeemed] INT NOT NULL DEFAULT 0,
    [points_expired] INT NOT NULL DEFAULT 0,
    [description] NVARCHAR(255) NULL,
    [created_at] DATETIME DEFAULT GETDATE()
);
GO
-- bảng ca làm 
CREATE TABLE [dbo].[Shifts] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [user_id] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Users](id),
    [check_in_time] DATETIME NOT NULL,
    [check_out_time] DATETIME NULL,
    [handover_notes] NVARCHAR(MAX) NULL,
    [is_active] BIT NOT NULL DEFAULT 1,
    [created_at] DATETIME DEFAULT GETDATE()
);
GO
-- bảng ghi log
CREATE TABLE [dbo].[Audit_Logs] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [user_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Users](id),
    [action] NVARCHAR(50) NOT NULL,
    [table_name] NVARCHAR(100) NOT NULL,
    [record_id] INT NOT NULL,
    [old_value] NVARCHAR(MAX) NULL,
    [new_value] NVARCHAR(MAX) NULL,
    [created_at] DATETIME DEFAULT GETDATE()
);
GO
CREATE TABLE [dbo].[Notifications] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [user_id] INT NULL FOREIGN KEY REFERENCES [dbo].[Users](id),
    [title] NVARCHAR(255) NOT NULL,
    [content] NVARCHAR(MAX) NOT NULL,
    [type] VARCHAR(50) NULL,
    [reference_link] VARCHAR(255) NULL,
    [is_read] BIT NOT NULL DEFAULT 0,
    [created_at] DATETIME DEFAULT GETDATE()
);
GO
-- ==============================================================================
-- PHẦN 2: LỆNH INSERT DỮ LIỆU 
-- ==============================================================================
-- Người dùng
SET IDENTITY_INSERT [dbo].[Roles] ON;
INSERT INTO [dbo].[Roles] ([id], [name], [description]) VALUES 
(1, N'Admin', N'Quản trị viên toàn quyền'), 
(2, N'Manager', N'Quản lý khách sạn'), 
(3, N'Receptionist', N'Lễ tân'),
(4, N'Accountant', N'Kế toán'), 
(5, N'Housekeeping', N'Nhân viên Buồng phòng'), 
(6, N'Security', N'Bảo vệ'),
(7, N'Chef', N'Đầu bếp'), 
(8, N'Waiter', N'Nhân viên phục vụ'), 
(9, N'IT Support', N'Kỹ thuật viên IT'),
(10, N'Guest', N'Khách hàng'),
(11, N'Inventory Manager', N'Thủ kho'),
(12, N'Marketing', N'Nhân viên Truyền thông');
SET IDENTITY_INSERT [dbo].[Roles] OFF;
GO
SET IDENTITY_INSERT [dbo].[Permissions] ON;
INSERT INTO [dbo].[Permissions] ([id], [name]) VALUES 
(1, N'VIEW_DASHBOARD'), 
(2, N'MANAGE_USERS'), 
(3, N'MANAGE_ROLES'), 
(4, N'VIEW_USERS'),
(5, N'VIEW_ROLES'),
(6, N'MANAGE_ROOMS'),         
(7, N'UPDATE_ROOM_STATUS'),    
(8, N'UPDATE_CLEANING_STATUS'), 
(9, N'MANAGE_INVENTORY'),      
(10, N'MANAGE_BOOKINGS'), 
(11, N'MANAGE_INVOICES'), 
(12, N'MANAGE_SERVICES'), 
(13, N'VIEW_REPORTS'), 
(14, N'MANAGE_CONTENT'),      
(15, N'MANAGE_SHIFTS'),        
(16, N'VIEW_AUDIT_LOGS'), 
(17, N'MANAGE_VOUCHERS');       
SET IDENTITY_INSERT [dbo].[Permissions] OFF;
GO
INSERT INTO [dbo].[Role_Permissions] ([role_id], [permission_id]) VALUES 
-- ROLE 1: ADMIN (Full quyền)
(1, 1),(1, 2),(1, 3),(1, 4),(1, 5),(1, 6),(1, 7),(1, 8),(1, 9),
(1,10),(1,11),(1,12),(1,13),(1,14),(1,15),(1,16),(1,17),
-- ROLE 2: MANAGER
(2, 1),(2, 4),(2, 5),(2, 6),(2, 7),(2, 8),(2, 9),
(2,10),(2,11),(2,12),(2,13),(2,14),(2,15),(2,17),
-- ROLE 3: RECEPTIONIST
(3, 1),(3, 7),(3,10),(3,11),(3,15),
-- ROLE 4: ACCOUNTANT
(4, 1),(4,11),(4,13),(4,15),
-- ROLE 5: HOUSEKEEPING
(5, 8),(5,15),
-- ROLE 6: SECURITY
(6, 15),
-- ROLE 7: CHEF
(7, 12),(7,15),
-- ROLE 8: WAITER
(8, 12),(8,15),
-- ROLE 9: IT SUPPORT
(9, 1),(9, 4),(9, 5),(9,15),(9,16),
-- ROLE 10: GUEST (không quyền)
-- ROLE 11: INVENTORY MANAGER
(11, 1),(11, 9),(11,13),(11,15),
-- ROLE 12: MARKETING
(12, 1),(12,13),(12,14),(12,15),(12,17);
GO
SET IDENTITY_INSERT [dbo].[Memberships] ON;
INSERT INTO [dbo].[Memberships] ([id], [tier_name], [min_points], [discount_percent]) VALUES 
(1, N'Khách Mới', 0, 0), 
(2, N'Đồng', 1000, 5), 
(3, N'Bạc', 3000, 8),
(4, N'Vàng', 5000, 10), 
(5, N'Kim Cương', 10000, 15);
SET IDENTITY_INSERT [dbo].[Memberships] OFF;
GO
SET IDENTITY_INSERT [dbo].[Users] ON;
INSERT INTO [dbo].[Users] ([id], [role_id], [membership_id], [full_name], [email], [phone], [password_hash], [status]) VALUES 
(1, 1, NULL, N'Nguyễn Admin', N'admin@hotel.com', N'0901000001', N'$2a$12$Q7rtMqznJVr3RtIY/F79keNsfy5PR8Tm6B6faYdT/LAE/Woq80e62', 1),
(2, 2, NULL, N'Nguyễn Quốc Tú', N'manager@hotel.com', N'0901000002', N'$2a$12$Q7rtMqznJVr3RtIY/F79keNsfy5PR8Tm6B6faYdT/LAE/Woq80e62', 1),
(3, 3, NULL, N'Lê Thu Thảo', N'reception1@hotel.com', N'0901000003', N'$2a$12$Q7rtMqznJVr3RtIY/F79keNsfy5PR8Tm6B6faYdT/LAE/Woq80e62', 1),
(4, 3, NULL, N'Phạm Văn Minh', N'reception2@hotel.com', N'0901000004', N'$2a$12$Q7rtMqznJVr3RtIY/F79keNsfy5PR8Tm6B6faYdT/LAE/Woq80e62', 1),
(5, 4, NULL, N'Hoàng Thanh Tùng', N'accountant@hotel.com', N'0901000005', N'$2a$12$Q7rtMqznJVr3RtIY/F79keNsfy5PR8Tm6B6faYdT/LAE/Woq80e62', 1),
(6, 12, NULL, N'Lý Mỹ Linh', N'marketing@hotel.com', N'0901000016', N'$2a$12$Q7rtMqznJVr3RtIY/F79keNsfy5PR8Tm6B6faYdT/LAE/Woq80e62', 1),
(7, 11, NULL, N'Hồ Văn Khoa', N'inventory@hotel.com', N'0901000011', N'$2a$12$Q7rtMqznJVr3RtIY/F79keNsfy5PR8Tm6B6faYdT/LAE/Woq80e62', 1),
(8, 5, NULL, N'Vũ Thị Lan', N'housekeeping@hotel.com', N'0901000012', N'$2a$12$Q7rtMqznJVr3RtIY/F79keNsfy5PR8Tm6B6faYdT/LAE/Woq80e62', 1),
(9, 9, NULL, N'Ngô Minh Tuấn', N'it@hotel.com', N'0901000013', N'$2a$12$Q7rtMqznJVr3RtIY/F79keNsfy5PR8Tm6B6faYdT/LAE/Woq80e62', 1),
(10, 6, NULL, N'Đặng Văn Thép', N'security@hotel.com', N'0901000014', N'$2a$12$Q7rtMqznJVr3RtIY/F79keNsfy5PR8Tm6B6faYdT/LAE/Woq80e62', 1),
(11, 7, NULL, N'Bùi Tuấn Hải', N'chef@hotel.com', N'0901000015', N'$2a$12$Q7rtMqznJVr3RtIY/F79keNsfy5PR8Tm6B6faYdT/LAE/Woq80e62', 1),
(12, 8, NULL, N'Đỗ Tuấn Anh', N'waiter@hotel.com', N'0901000017', N'$2a$12$Q7rtMqznJVr3RtIY/F79keNsfy5PR8Tm6B6faYdT/LAE/Woq80e62', 1),
(13, 10, 1, N'Viên Xuân Quý', N'vienxuanquy82024@gmail.com', N'0901000006', N'$2a$12$Q7rtMqznJVr3RtIY/F79keNsfy5PR8Tm6B6faYdT/LAE/Woq80e62', 1),
(14, 10, 2, N'Trương Thị Ánh', N'truongthianh23ct112@gmail.com', N'0901000007', N'$2a$12$Q7rtMqznJVr3RtIY/F79keNsfy5PR8Tm6B6faYdT/LAE/Woq80e62', 1),
(15, 10, 3, N'Nguyễn Thị Hồng Nhung', N'honggnhungg1605@gmail.com', N'0901000008', N'$2a$12$Q7rtMqznJVr3RtIY/F79keNsfy5PR8Tm6B6faYdT/LAE/Woq80e62', 1),
(16, 10, 4, N'Nguyễn Thị Phương Thảo', N'phuongthao2005ab@gmail.com', N'0901000009', N'$2a$12$Q7rtMqznJVr3RtIY/F79keNsfy5PR8Tm6B6faYdT/LAE/Woq80e62', 1),
(17, 10, 5, N'Huỳnh Thị Trúc Ly', N'httly20092005@gmail.com', N'0901000010', N'$2a$12$Q7rtMqznJVr3RtIY/F79keNsfy5PR8Tm6B6faYdT/LAE/Woq80e62', 1);
SET IDENTITY_INSERT [dbo].[Users] OFF;
GO
GO
-- Vật tư
SET IDENTITY_INSERT [dbo].[Amenities] ON;
INSERT INTO [dbo].[Amenities] ([id], [name], [icon_url]) VALUES 
(1, N'Wifi Miễn Phí', N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775076276/abchotel/nbmk4rbzezt0zz2awm8a.png'), 
(2, N'Smart TV', N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775075677/abchotel/zjezmfg1peinqew4eajt.png'), 
(3, N'Điều Hòa', N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775075697/abchotel/gylftilqo31cqc5wjpxr.png'),
(4, N'Bồn Tắm Sứ', N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775075717/abchotel/nrpvfk5uvij96qdzeoxc.png'), 
(5, N'Ban Công', N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775075956/abchotel/yczwpsgrqfwvqhntkt0t.png'), 
(6, N'Minibar', N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775075759/abchotel/dv5lfsbnyjtiqdy2lq7m.png'),
(7, N'Két Sắt', N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775076224/abchotel/ckfycmh8knlccvjewkvx.png'),
(8, N'Máy Sấy Tóc', N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775076237/abchotel/rrrul4h2lm5okyve99xw.png'), 
(9, N'Máy Pha Cà Phê', N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775076250/abchotel/cgs3okt75wcjbq7gcqjj.png'),
(10, N'Bàn Làm Việc', N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775076262/abchotel/arcpp7q5oz4h0bzmamkg.png');
SET IDENTITY_INSERT [dbo].[Amenities] OFF;
GO
SET IDENTITY_INSERT [dbo].[Equipments] ON;
INSERT INTO [dbo].[Equipments] ([id], [item_code], [name], [category], [unit], [total_quantity], [in_use_quantity], [damaged_quantity], [liquidated_quantity], [base_price], [default_price_if_lost], [supplier], [is_active], [image_url]) VALUES 
(1, 'TV-SS-43', N'Smart TV Samsung 43 inch', N'Điện tử', N'Cái', 60, 50, 1, 0, 7500000, 8000000, N'Samsung Vietnam', 1, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775147835/abchotel/sekontj2hjzfhr6eygki.jpg'),
(2, 'AC-DK-9000', N'Điều hòa Daikin 9000 BTU', N'Điện tử', N'Cái', 60, 55, 0, 0, 8200000, 9000000, N'Daikin Vietnam', 1, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775147811/abchotel/od88omxgpn2gewxepdip.jpg'),
(3, 'MB-AF-50', N'Tủ lạnh Minibar Aqua 50L', N'Điện tử', N'Cái', 70, 58, 2, 0, 2500000, 3000000, N'Aqua', 1, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775147793/abchotel/k9pkvzaoqhkl038pk7zz.jpg'),
(4, 'HD-PN-1000', N'Máy sấy tóc Panasonic', N'Điện tử', N'Cái', 70, 58, 5, 1, 450000, 600000, N'Điện Máy Xanh', 1, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775147771/abchotel/qmyoa4cwy7npqagf3sbd.jpg'),
(5, 'KL-SH-17', N'Ấm đun nước siêu tốc Sunhouse', N'Điện tử', N'Cái', 70, 58, 2, 2, 250000, 350000, N'Sunhouse', 1, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775147592/abchotel/vczhrb1xae2s4achqc3d.jpg'),
(6, 'BD-KG-20', N'Giường King Size 2m x 2m2', N'Nội thất', N'Chiếc', 120, 100, 0, 0, 12000000, 15000000, N'Nội thất Hòa Phát', 1, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775147891/abchotel/efav4xkd2vz1frcljc2f.jpg'),
(7, 'BD-SG-12', N'Giường Single 1m2 x 2m', N'Nội thất', N'Chiếc', 50, 41, 0, 0, 5500000, 7000000, N'Nội thất Hòa Phát', 1, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775147567/abchotel/bmndld75tbvlhh7acbjh.jpg'),
(8, 'WD-WD-01', N'Tủ quần áo gỗ công nghiệp', N'Nội thất', N'Cái', 70, 58, 0, 0, 3500000, 5000000, N'Xưởng Gỗ An Cường', 1, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775146133/abchotel/lkibicpdakkdc2gqp6c4.jpg'),
(9, 'TB-WK-01', N'Bàn làm việc + Ghế đệm', N'Nội thất', N'Bộ', 65, 54, 1, 0, 2200000, 3000000, N'Nội thất Hòa Phát', 1, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775146110/abchotel/snj7eeexxgrjvyuz9tlh.jpg'),
(10, 'HG-WD-01', N'Móc treo quần áo bằng gỗ', N'Nội thất', N'Chiếc', 500, 408, 10, 5, 15000, 30000, N'Nhựa Duy Tân', 1, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775146097/abchotel/qujuesi0hzsb7feeafcj.jpg'),
(11, 'TW-BT-01', N'Khăn tắm cotton 70x140cm', N'Đồ vải', N'Chiếc', 200, 110, 5, 10, 85000, 150000, N'Dệt may Thành Công', 1, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775145951/abchotel/lhdgm4ipfatqxingoxgo.jpg'),
(12, 'TW-FC-01', N'Khăn mặt cotton 30x30cm', N'Đồ vải', N'Chiếc', 200, 108, 2, 5, 25000, 50000, N'Dệt may Thành Công', 1, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775145850/abchotel/mze1ksxfvwufy0hcnqxh.jpg'),
(16, 'DR-LV-500', N'Nước suối Lavie 500ml', N'Minibar', N'Chai', 493, 108, 0, 0, 4000, 0, N'Lavie', 1, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775145833/abchotel/mk8ize4lr5dngdj3zbwg.jpg'),
(17, 'DR-CC-320', N'Nước ngọt Coca Cola 320ml', N'Minibar', N'Lon', 296, 60, 0, 0, 7000, 20000, N'Coca Cola', 1, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775145819/abchotel/zdkidxk8g14a3limpkkb.jpg'),
(18, 'DR-HB-330', N'Bia Heineken 330ml', N'Minibar', N'Lon', 200, 46, 0, 0, 16000, 35000, N'Heineken', 1, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775145794/abchotel/guk4pazknafewx765fxa.jpg'),
(21, 'TV-SS-55', N'Tivi SamSung 55 inch', N'Điện tử', N'Cái', 10, 2, 0, 0, 15000000, 17000000, N'Điện Máy Xanh', 1, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775145674/abchotel/dxtsgusaa6vqqaje4i2e.jpg');
SET IDENTITY_INSERT [dbo].[Equipments] OFF;
GO
-- Phòng
SET IDENTITY_INSERT [dbo].[Room_Types] ON;
INSERT INTO [dbo].[Room_Types] ([id], [name], [base_price], [price_per_hour], [capacity_adults], [capacity_children], [description]) VALUES 
(1, N'Standard Single', 400000, 40000, 1, 0, N'Phòng tiêu chuẩn 1 giường đơn'),
(2, N'Standard Double', 500000, 50000, 2, 1, N'Phòng tiêu chuẩn 1 giường đôi'),
(3, N'Superior City View', 700000, 70000, 2, 1, N'Phòng cao cấp hướng phố'),
(4, N'Deluxe Ocean View', 900000, 90000, 2, 2, N'Phòng Deluxe hướng biển'),
(5, N'Premium Deluxe', 1200000, 120000, 2, 2, N'Phòng Premium tiện nghi cao cấp'),
(6, N'Family Suite', 1500000, 150000, 4, 2, N'Phòng Suite cho gia đình'),
(7, N'Junior Suite', 1800000, 180000, 2, 2, N'Phòng Suite nhỏ nhắn sang trọng'),
(8, N'Executive Suite', 2500000, 250000, 2, 2, N'Phòng Suite cho doanh nhân'),
(9, N'Presidential Suite', 5000000, 500000, 4, 2, N'Phòng Tổng thống'),
(10, N'Royal Villa', 8000000, 800000, 6, 4, N'Biệt thự hoàng gia nguyên căn');
SET IDENTITY_INSERT [dbo].[Room_Types] OFF;
GO
SET IDENTITY_INSERT [dbo].[Rooms] ON;
INSERT INTO [dbo].[Rooms] ([id], [room_type_id], [room_number], [floor], [status]) VALUES 
(1, 1, N'101', 1, N'Available'), 
(2, 2, N'102', 1, N'Occupied'), 
(3, 3, N'201', 2, N'Cleaning'),
(4, 4, N'202', 2, N'Maintenance'), 
(5, 5, N'301', 3, N'Available'), 
(6, 6, N'302', 3, N'Occupied'),
(7, 7, N'401', 4, N'Available'), 
(8, 8, N'402', 4, N'Available'), 
(9, 9, N'501', 5, N'Available'),
(10, 10, N'VILLA-1', 1, N'Available');
SET IDENTITY_INSERT [dbo].[Rooms] OFF;
GO
SET IDENTITY_INSERT [dbo].[Room_Inventory] ON;
INSERT INTO [dbo].[Room_Inventory] 
([id], [room_id], [equipmentId], [quantity], [price_if_lost], [is_active], [note]) VALUES
(1, 1, 1, 1, 8000000.00, 1, N'Treo tường, kèm remote'),
(2, 1, 2, 1, 9000000.00, 1, N'Mới bảo dưỡng tháng trước'),
(3, 1, 3, 1, 3000000.00, 1, N'Nằm dưới kệ tivi'),
(4, 1, 4, 1, 600000.00, 1, N'Cất trong ngăn kéo bàn'),
(5, 1, 5, 1, 350000.00, 1, N'Để trên bàn làm việc'),
(6, 1, 7, 1, 7000000.00, 1, N'Không bao gồm nệm'),
(7, 1, 8, 1, 5000000.00, 1, N'Tủ 2 cánh lùa'),
(8, 1, 9, 1, 3000000.00, 1, N'Đặt sát cửa sổ'),
(9, 1, 10, 5, 30000.00, 1, N'Treo sẵn trong tủ'),
(10, 1, 11, 2, 150000.00, 1, N'Gấp hình thiên nga trên giường'),
(11, 1, 12, 2, 50000.00, 1, N'Cuộn tròn để trên kệ gương'),
(12, 1, 16, 2, 0.00, 1, N'Miễn phí hàng ngày, để trên bàn'),
(13, 1, 17, 2, 20000.00, 1, N'Ướp lạnh trong tủ'),
(14, 1, 18, 2, 35000.00, 1, N'Ướp lạnh trong tủ'),
(15, 3, 21, 1, 17000000.00, 1, N'Treo tường'),
(16, 3, 2, 1, 9000000.00, 1, N'Điều hòa 9000 BTU'),
(17, 3, 6, 1, 15000000.00, 1, N'Giường lớn giữa phòng'),
(18, 3, 11, 2, 150000.00, 1, N'Gấp gọn gàng');
SET IDENTITY_INSERT [dbo].[Room_Inventory] OFF;
GO
INSERT INTO [dbo].[RoomType_Amenities] ([room_type_id], [amenity_id]) VALUES
(1, 1), (1, 2), (1, 3), (2, 1), (2, 2), (3, 4), (3, 5), (4, 6), (4, 7), (5, 8);
GO
SET IDENTITY_INSERT [dbo].[Room_Images] ON;

INSERT INTO [dbo].[Room_Images]
([id], [room_type_id], [image_url], [is_primary], [is_active], [created_at], [created_by], [updated_at], [updated_by])
VALUES
-- Room Type 1
(1, 1, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775058971/abchotel/j8qzhwycc1qpkattxmfz.jpg', 1, 1, '2026-04-01T22:56:12.417', NULL, NULL, NULL),
(2, 1, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775058982/abchotel/flca5nefapqbloaus4mc.jpg', 0, 1, '2026-04-01T22:56:23.477', NULL, NULL, NULL),
(3, 1, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775059005/abchotel/j07vv0vtttzedzdrs0bg.jpg', 0, 1, '2026-04-01T22:56:46.790', NULL, NULL, NULL),

-- Room Type 2
(4, 2, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775059252/abchotel/oeygfktr8ak12lp8xmfn.jpg', 1, 1, '2026-04-01T23:00:53.823', NULL, NULL, NULL),
(5, 2, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775059269/abchotel/fmauuypbyjedul2hem1p.jpg', 0, 1, '2026-04-01T23:01:10.183', NULL, NULL, NULL),
(6, 2, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775059279/abchotel/cetdu8av7lkarmin3xxi.jpg', 0, 1, '2026-04-01T23:01:20.690', NULL, NULL, NULL),

-- Room Type 3
(7, 3, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775057898/abchotel/yaruy1sorcoip3uzfrtb.jpg', 1, 1, '2026-04-01T22:38:19.930', NULL, NULL, NULL),
(8, 3, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775057915/abchotel/ibenivntrzhxtcxcydjy.jpg', 0, 1, '2026-04-01T22:38:36.987', NULL, NULL, NULL),
(9, 3, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775057924/abchotel/vs5gwxffxl6u2bcpefj8.jpg', 0, 1, '2026-04-01T22:38:46.373', NULL, NULL, NULL),

-- Room Type 4
(10, 4, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775053950/abchotel/d5gdmk8o0p5h9qrgwrbi.jpg', 1, 1, '2026-04-01T21:32:31.733', NULL, NULL, NULL),
(11, 4, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775054018/abchotel/jh9niiinimm5hwrjo1fu.jpg', 0, 1, '2026-04-01T21:33:40.007', NULL, NULL, NULL),
(12, 4, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775054031/abchotel/bwcf0hyfhabgdkmaixxo.jpg', 0, 1, '2026-04-01T21:33:54.437', NULL, NULL, NULL),

-- Room Type 5
(13, 5, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775060681/abchotel/iiszfn7eqhhwd4rwhvpg.jpg', 1, 1, '2026-04-01T23:24:43.233', NULL, NULL, NULL),
(14, 5, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775060706/abchotel/wkpqw9gutsuiaewmbtak.jpg', 0, 1, '2026-04-01T23:25:07.540', NULL, NULL, NULL),
(15, 5, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775060722/abchotel/vcrjjsmozgzkutcoshbg.jpg', 0, 1, '2026-04-01T23:25:22.727', NULL, NULL, NULL),

-- Room Type 6
(16, 6, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775060070/abchotel/face5dkumiff3xcckml0.jpg', 1, 1, '2026-04-01T23:14:32.873', NULL, NULL, NULL),
(17, 6, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775060088/abchotel/spaxkhfnes5guyuuj2bf.jpg', 0, 1, '2026-04-01T23:14:50.610', NULL, NULL, NULL),
(18, 6, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775060133/abchotel/b4it7djpgpzxbhotfqa8.jpg', 0, 1, '2026-04-01T23:15:35.060', NULL, NULL, NULL),

-- Room Type 7
(19, 7, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775061751/abchotel/fym4bd0jk5yllb5iqamb.jpg', 1, 1, '2026-04-01T23:42:31.843', NULL, NULL, NULL),
(20, 7, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775061658/abchotel/dpba6hsjd5vo8wnw3rep.jpg', 0, 1, '2026-04-01T23:40:59.327', NULL, NULL, NULL),
(21, 7, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775061734/abchotel/djqpllmnknw5ksusrd2f.jpg', 0, 1, '2026-04-01T23:42:14.513', NULL, NULL, NULL),

-- Room Type 8
(22, 8, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775060623/abchotel/cddvvzbiku6rfx3zdmmf.jpg', 1, 1, '2026-04-01T23:23:44.140', NULL, NULL, NULL),
(23, 8, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775060515/abchotel/izilhxudhh11wutxtb5f.jpg', 0, 1, '2026-04-01T23:21:56.560', NULL, NULL, NULL),
(24, 8, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775060528/abchotel/sleplob5tocinv3i9jvq.jpg', 0, 1, '2026-04-01T23:22:10.370', NULL, NULL, NULL),

-- Room Type 9
(25, 9, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775060198/abchotel/yu7faahxu52q7cuntusm.jpg', 1, 1, '2026-04-01T23:16:40.597', NULL, NULL, NULL),
(26, 9, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775060234/abchotel/rjd8bzs4hvl7kws5vvup.jpg', 0, 1, '2026-04-01T23:17:15.907', NULL, NULL, NULL),
(27, 9, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775060254/abchotel/xtdkktn8snmn3xldzojt.jpg', 0, 1, '2026-04-01T23:17:34.970', NULL, NULL, NULL),

-- Room Type 10
(28, 10, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775058048/abchotel/borrg46ezalheiaygmyd.jpg', 1, 1, '2026-04-01T22:40:48.793', NULL, NULL, NULL),
(29, 10, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775058066/abchotel/fxdakpiurrp0ycjixcu4.jpg', 0, 1, '2026-04-01T22:41:07.453', NULL, NULL, NULL),
(30, 10, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775058076/abchotel/pyf2zpsyncawhrsqlzwb.jpg', 0, 1, '2026-04-01T22:41:18.240', NULL, NULL, NULL),
(31, 10, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775058086/abchotel/rskv2wdyiwvmt3suazfp.jpg', 0, 1, '2026-04-01T22:41:27.320', NULL, NULL, NULL);
SET IDENTITY_INSERT [dbo].[Room_Images] OFF;
GO
-- Bài viết
SET IDENTITY_INSERT [dbo].[Article_Categories] ON;
INSERT INTO [dbo].[Article_Categories] ([id], [name], [slug]) VALUES 
(1, N'Tin Tức Khách Sạn', 'tin-tuc-khach-san'), 
(2, N'Cẩm Nang Du Lịch', 'cam-nang-du-lich'),
(3, N'Khám Phá Ẩm Thực', 'kham-pha-am-thuc'), 
(4, N'Sự Kiện & Lễ Hội', 'su-kien-le-hoi'),
(5, N'Chương Trình Khuyến Mãi', 'chuong-trinh-khuyen-mai'), 
(6, N'Văn Hóa Địa Phương', 'van-hoa-dia-phuong'),
(7, N'Hướng Dẫn Di Chuyển', 'huong-dan-di-chuyen'), 
(8, N'Góc Thư Giãn', 'goc-thu-gian'),
(9, N'Hỏi Đáp (FAQ)', 'hoi-dap-faq'), 
(10, N'Thư Viện Ảnh', 'thu-vien-anh');
SET IDENTITY_INSERT [dbo].[Article_Categories] OFF;
GO
SET IDENTITY_INSERT [dbo].[Articles] ON;
INSERT INTO [dbo].[Articles] ([id], [category_id], [author_id], [title], [slug], [short_description], [content], [thumbnail_url], [published_at]) VALUES 
(1, 1, 1, N'Khai trương nhà hàng hải sản Ocean View', N'khai-truong-nha-hang', N'Chào đón nhà hàng mới mang đẳng cấp 5 sao ngay trong khuôn viên khách sạn với ưu đãi 20%.', NULL, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775068010/abchotel/zhiqb8waywm93dtx0vkh.jpg', '2026-03-06'),
(2, 2, 2, N'5 điểm đến không thể bỏ lỡ khi đến đây', N'5-diem-den', N'Lưu lại ngay danh sách 5 địa điểm check-in cực hot xung quanh khách sạn của chúng tôi.', NULL, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775051779/abchotel/pygtbkrdfkaqmvolf7yg.jpg', '2026-03-06'),
(3, 3, 3, N'Khám phá tinh hoa ẩm thực địa phương', N'mon-ngon-hai-san', N'Từ những gánh hàng rong đến các nhà hàng sang trọng, đây là những món bạn phải thử.', NULL, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775068189/abchotel/yumqrqbadves92v1idpu.jpg', '2026-03-06'),
(4, 4, 1, N'Đại tiệc Countdown đếm ngược năm mới 2027', N'su-kien-nam-moi', N'Hòa cùng không khí lễ hội cuối năm với đêm nhạc hội và pháo hoa rực rỡ.', NULL, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775051977/abchotel/jjjmgilirxampfayomat.jpg', '2026-03-06'),
(5, 5, 2, N'Gói nghỉ dưỡng gia đình - Mùa hè rực rỡ 2026', N'khuyen-mai-mua-he', N'Tận hưởng mùa hè bùng nổ với gói combo 3 ngày 2 đêm siêu tiết kiệm cho cả gia đình.', NULL, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775068210/abchotel/w72i22sz0gycbuaseah3.jpg', '2026-03-06'),
(6, 6, 3, N'Lễ hội Nghinh Ông và nét đẹp văn hóa biển', N'lich-su-van-hoa', N'Cùng tìm hiểu về lễ hội truyền thống lớn nhất của ngư dân vùng biển.', NULL, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775068225/abchotel/hsr1vvx2axblkl4rh6rd.jpg', '2026-03-06'),
(7, 7, 1, N'Hướng dẫn di chuyển từ sân bay về khách sạn', N'tu-san-bay-ve-ks', N'Chi tiết các phương tiện tiện lợi nhất để di chuyển từ sân bay quốc tế về thẳng khách sạn.', NULL, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775051887/abchotel/dwravtzojerdio4y19ix.jpg', '2026-03-06'),
(8, 8, 2, N'Gợi ý lịch trình thư giãn cuối tuần hoàn hảo', N'cach-thu-gian', N'Chỉ với 2 ngày nghỉ, làm sao để xua tan mọi mệt mỏi và F5 lại bản thân? Đọc ngay!', NULL, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775068239/abchotel/ffyi4wyufzjs8uzrvwuu.jpg', '2026-03-06'),
(9, 9, 3, N'Những quy định cần biết khi nhận và trả phòng', N'quy-dinh-nhan-tra', N'Giải đáp các thắc mắc thường gặp về giờ check-in, check-out và phụ phí phát sinh.', NULL, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775051909/abchotel/sauxn5rb0if3ouxjlder.jpg', '2026-03-06'),
(10, 10, 1, N'Chiêm ngưỡng resort từ góc nhìn Flycam', N'bo-anh-resort', N'Bộ ảnh toàn cảnh khách sạn nhìn từ trên cao đẹp như một bức tranh.', NULL, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775068254/abchotel/ynnbbgulwukdogjhgpgj.jpg', '2026-03-06');
SET IDENTITY_INSERT [dbo].[Articles] OFF;
GO
-- Điểm du lịch
SET IDENTITY_INSERT [dbo].[Attractions] ON;

INSERT INTO [dbo].[Attractions] ([id], [name], [distance_km], [description], [address], [latitude], [longitude], [map_embed_link]) VALUES 
(1, N'Chợ Trung Tâm', 1.50, N'Khu chợ truyền thống sầm uất, bán đặc sản và hải sản tươi sống.', N'01 Nguyễn Thái Học, Phường 1, TP. Biển', 10.345678, 107.084123, N'https://maps.google.com/maps?q=10.345678,107.084123&z=15&output=embed'),
(2, N'Bãi Biển Chính', 0.50, N'Bãi tắm công cộng tuyệt đẹp, cát trắng trải dài, nước biển trong xanh.', N'Đường Thùy Vân, Phường Thắng Tam, TP. Biển', 10.334102, 107.091564, N'https://maps.google.com/maps?q=10.334102,107.091564&z=15&output=embed'),
(3, N'Bảo Tàng Thành Phố', 3.00, N'Lưu giữ giá trị lịch sử và hàng ngàn hiện vật văn hóa lâu đời.', N'98 Trần Hưng Đạo, Phường 3, TP. Biển', 10.348211, 107.072134, N'https://maps.google.com/maps?q=10.348211,107.072134&z=15&output=embed'),
(4, N'Phố Đi Bộ', 1.00, N'Khu vực vui chơi giải trí về đêm, nhiều hoạt động nghệ thuật và ẩm thực đường phố.', N'Quảng trường Trung tâm, TP. Biển', 10.352134, 107.073456, N'https://maps.google.com/maps?q=10.352134,107.073456&z=15&output=embed'),
(5, N'Chùa Cổ Lịch Sử', 5.50, N'Ngôi chùa linh thiêng với kiến trúc cổ kính nằm tựa lưng vào núi.', N'Núi Lớn, Phường 5, TP. Biển', 10.361522, 107.065211, N'https://maps.google.com/maps?q=10.361522,107.065211&z=15&output=embed'),
(6, N'Khu Vui Chơi Giải Trí', 8.00, N'Công viên trò chơi quy mô lớn, cáp treo xuyên biển và công viên nước trên đỉnh núi.', N'Khu du lịch sinh thái, TP. Biển', 10.375533, 107.051122, N'https://maps.google.com/maps?q=10.375533,107.051122&z=15&output=embed'),
(7, N'Suối Nước Nóng', 15.00, N'Điểm nghỉ dưỡng thiên nhiên, ngâm chân thư giãn và trải nghiệm khoáng nóng.', N'Quốc lộ 55, Huyện Ngoại Ô', 10.612544, 107.456833, N'https://maps.google.com/maps?q=10.612544,107.456833&z=15&output=embed'),
(8, N'Làng Nghề Truyền Thống', 12.00, N'Trải nghiệm văn hóa bản địa, tìm hiểu quy trình làm gốm và đan lát thủ công.', N'Làng gốm mỹ nghệ, Huyện Ngoại Ô', 10.456155, 107.123544, N'https://maps.google.com/maps?q=10.456155,107.123544&z=15&output=embed'),
(9, N'Trung Tâm Thương Mại', 2.00, N'Khu mua sắm cao cấp, tổ hợp rạp chiếu phim và chuỗi nhà hàng quốc tế.', N'Góc ngã tư Nguyễn Văn Linh, TP. Biển', 10.359866, 107.098855, N'https://maps.google.com/maps?q=10.359866,107.098855&z=15&output=embed'),
(10, N'Điểm Ngắm Hoàng Hôn', 4.00, N'Nơi có view biển đón hoàng hôn đẹp nhất, góc check-in sống ảo cực chill.', N'Mũi Nghinh Phong, Phường 2, TP. Biển', 10.323577, 107.085466, N'https://maps.google.com/maps?q=10.323577,107.085466&z=15&output=embed');
SET IDENTITY_INSERT [dbo].[Attractions] OFF;
GO
-- Vouchers
SET IDENTITY_INSERT [dbo].[Vouchers] ON;
INSERT INTO [dbo].[Vouchers] ([id], [code], [discount_type], [discount_value], [min_booking_value], [valid_from], [valid_to], [usage_limit]) VALUES
(1, N'KM1', N'PERCENT', 10, 500000, '2025-01-01', '2026-12-31', 100),
(2, N'KM2', N'FIXED_AMOUNT', 100000, 1000000, '2025-01-01', '2026-12-31', 50),
(3, N'KM3', N'PERCENT', 15, 2000000, '2025-01-01', '2026-12-31', 30),
(4, N'KM4', N'FIXED_AMOUNT', 200000, 1500000, '2025-01-01', '2026-12-31', 50),
(5, N'KM5', N'PERCENT', 20, 3000000, '2025-01-01', '2026-12-31', 20),
(6, N'KM6', N'FIXED_AMOUNT', 50000, 0, '2025-01-01', '2026-12-31', 200),
(7, N'KM7', N'PERCENT', 5, 0, '2025-01-01', '2026-12-31', 500),
(8, N'KM8', N'FIXED_AMOUNT', 500000, 5000000, '2025-01-01', '2026-12-31', 10),
(9, N'KM9', N'PERCENT', 25, 10000000, '2025-01-01', '2026-12-31', 5),
(10, N'KM10', N'FIXED_AMOUNT', 1000000, 20000000, '2025-01-01', '2026-12-31', 2);
SET IDENTITY_INSERT [dbo].[Vouchers] OFF;
GO
-- BOOKING
SET IDENTITY_INSERT [dbo].[Bookings] ON;
INSERT INTO [dbo].[Bookings] ([id], [user_id], [guest_name], [guest_phone], [booking_code], [status], [created_by]) VALUES 
(1, 6, N'Khách Hàng A', N'0900000006', N'BK-0001', N'Completed', 3),
(2, 7, N'Khách Hàng B', N'0900000007', N'BK-0002', N'Checked_in', 3),
(3, 8, N'Khách Hàng C', N'0900000008', N'BK-0003', N'Confirmed', 3),
(4, 9, N'Khách Hàng D', N'0900000009', N'BK-0004', N'Pending', 3),
(5, 10, N'Khách Hàng E', N'0900000010', N'BK-0005', N'Cancelled', 4),
(6, NULL, N'Khách Vãng Lai 1', N'0911111111', N'BK-0006', N'Completed', 4),
(7, NULL, N'Khách Vãng Lai 2', N'0922222222', N'BK-0007', N'Checked_in', 4),
(8, 6, N'Khách Hàng A', N'0900000006', N'BK-0008', N'Confirmed', 2),
(9, 7, N'Khách Hàng B', N'0900000007', N'BK-0009', N'Completed', 2),
(10, 8, N'Khách Hàng C', N'0900000008', N'BK-0010', N'Checked_in', 2),
(11, 8, N'Khách Hàng C', N'0900000008', N'BK-0011', N'Completed', 2),
(12, 9, N'Khách Hàng D', N'0900000009', N'BK-0012', N'Completed', 2),
(13, 10, N'Khách Hàng E', N'0900000010', N'BK-0013', N'Completed', 3),
(14, 6, N'Khách Hàng A', N'0900000006', N'BK-0014', N'Completed', 3),
(15, 7, N'Khách Hàng B', N'0900000007', N'BK-0015', N'Completed', 4),
(16, 8, N'Khách Hàng C', N'0900000008', N'BK-0016', N'Completed', 4),
(17, 9, N'Khách Hàng D', N'0900000009', N'BK-0017', N'Completed', 2),
(18, 10, N'Khách Hàng E', N'0900000010', N'BK-0018', N'Completed', 3);
SET IDENTITY_INSERT [dbo].[Bookings] OFF;
GO
SET IDENTITY_INSERT [dbo].[Booking_Details] ON;
INSERT INTO [dbo].[Booking_Details] ([id], [booking_id], [room_id], [room_type_id], [check_in_date], [check_out_date], [applied_price], [price_type]) VALUES
(1, 1, 1, 1, '2026-03-01', '2026-03-03', 400000, 'NIGHTLY'), 
(2, 2, 2, 2, '2026-03-05', '2026-03-10', 500000, 'NIGHTLY'),
(3, 3, NULL, 3, '2026-07-10', '2026-07-12', 700000, 'NIGHTLY'), 
(4, 4, NULL, 4, '2026-05-01', '2026-05-05', 900000, 'NIGHTLY'),
(5, 5, NULL, 5, '2026-03-15', '2026-03-16', 1200000, 'NIGHTLY'), 
(6, 6, 6, 6, '2026-02-10', '2026-02-12', 1500000, 'NIGHTLY'),
(7, 7, 7, 7, '2026-03-07', '2026-03-09', 1800000, 'NIGHTLY'), 
(8, 8, NULL, 8, '2026-06-01', '2026-06-05', 2500000, 'NIGHTLY'),
(9, 9, 9, 9, '2026-01-20', '2026-01-25', 5000000, 'NIGHTLY'), 
(10, 10, 10, 10, '2026-03-06', '2026-03-08', 8000000, 'NIGHTLY'),
(11, 11, NULL, 3, '2026-02-01', '2026-02-03', 700000, 'NIGHTLY'),  
(12, 12, NULL, 4, '2026-02-05', '2026-02-07', 900000, 'NIGHTLY'),  
(13, 13, NULL, 5, '2026-02-10', '2026-02-12', 1200000, 'NIGHTLY'),
(14, 14, 6, 6, '2026-01-15', '2026-01-18', 1500000, 'NIGHTLY'),    
(15, 15, 7, 7, '2026-01-20', '2026-01-22', 1800000, 'NIGHTLY'),   
(16, 16, NULL, 8, '2026-01-25', '2026-01-28', 2500000, 'NIGHTLY'), 
(17, 17, 2, 2, '2025-12-10', '2025-12-12', 500000, 'NIGHTLY'),     
(18, 18, 10, 10, '2025-12-20', '2025-12-25', 8000000, 'NIGHTLY');
SET IDENTITY_INSERT [dbo].[Booking_Details] OFF;
GO
-- Reviews
SET IDENTITY_INSERT [dbo].[Reviews] ON;
INSERT INTO [dbo].[Reviews] ([id], [user_id], [booking_id], [room_type_id], [rating], [comment], [is_visible]) VALUES
(1, 6, 1, 1, 5, N'Phòng sạch sẽ, rất đáng tiền!', 1),          
(2, 7, 9, 9, 5, N'Trải nghiệm tuyệt vời nhất.', 1),           
(3, 8, 11, 3, 3, N'Bình thường, rèm cửa hơi sáng.', 1),         
(4, 9, 12, 4, 5, N'View biển nhìn thẳng ra đón bình minh.', 1),
(5, 10, 13, 5, 4, N'Giường nằm êm, tiện nghi hiện đại.', 1),    
(6, 6, 14, 6, 5, N'Rất thích hợp cho cả gia đình đông người.', 0),    
(7, 7, 15, 7, 4, N'Sang trọng, nhưng phục vụ phòng hơi lâu.', 0),      
(8, 8, 16, 8, 2, N'Chưa hài lòng với tốc độ dọn phòng lúc check-in.', 0), 
(9, 9, 17, 2, 5, N'Nhân viên thân thiện nhiệt tình.', 0),           
(10, 10, 18, 10, 5, N'Tiện ích Villa riêng tư, hoàn hảo mọi mặt.', 0);
SET IDENTITY_INSERT [dbo].[Reviews] OFF;
GO
-- Đền bù thiệt hại 
SET IDENTITY_INSERT [dbo].[Loss_And_Damages] ON;
INSERT INTO [dbo].[Loss_And_Damages] ([id], [booking_detail_id], [room_inventory_id], [quantity], [penalty_amount], [description]) VALUES
(1, 1, 2, 1, 300000, N'Làm mất điều khiển tivi'), 
(2, 2, 4, 1, 50000, N'Làm vỡ cốc thủy tinh'),
(3, 6, 3, 1, 400000, N'Làm hỏng bình đun siêu tốc'), 
(4, 9, 6, 1, 350000, N'Mất máy sấy tóc'),
(5, 10, 8, 2, 40000, N'Gãy móc treo quần áo'), 
(6, 1, 10, 1, 100000, N'Làm bẩn thảm lau chân không giặt được'),
(7, 2, 7, 1, 250000, N'Làm cháy gối nằm'), 
(8, 6, 5, 1, 450000, N'Mất áo choàng tắm'),
(9, 9, 4, 2, 100000, N'Vỡ 2 cốc thủy tinh'), 
(10, 10, 2, 1, 300000, N'Làm rơi vỡ điều khiển tivi');
SET IDENTITY_INSERT [dbo].[Loss_And_Damages] OFF;
GO
-- Dịch vụ
SET IDENTITY_INSERT [dbo].[Service_Categories] ON;
INSERT INTO [dbo].[Service_Categories] ([id], [name]) VALUES 
(1, N'Nhà Hàng & Ẩm Thực'), 
(2, N'Spa & Massage'), 
(3, N'Di Chuyển & Đưa Đón'),
(4, N'Giặt Ủi'), 
(5, N'Tour Du Lịch'), 
(6, N'Phòng Gym & Yoga'),
(7, N'Hồ Bơi'), 
(8, N'Tổ Chức Sự Kiện'), 
(9, N'Khu Vui Chơi Trẻ Em'), 
(10, N'Cửa Hàng Lưu Niệm');
SET IDENTITY_INSERT [dbo].[Service_Categories] OFF;
GO
SET IDENTITY_INSERT [dbo].[Services] ON;
INSERT INTO [dbo].[Services] ([id], [category_id], [name], [price], [unit]) VALUES
(1, 1, N'Set Ăn Sáng Buffet', 200000, N'Người'), 
(2, 1, N'Mì Ý Hải Sản', 150000, N'Phần'),
(3, 2, N'Massage Toàn Thân 60p', 500000, N'Lượt'), 
(4, 2, N'Xông Hơi Thảo Dược', 300000, N'Lượt'),
(5, 3, N'Đưa Đón Sân Bay 4 Chỗ', 350000, N'Chuyến'), 
(6, 3, N'Thuê Xe Máy Nửa Ngày', 100000, N'Chiếc'),
(7, 4, N'Giặt Khô Áo Vest', 120000, N'Cái'), 
(8, 4, N'Giặt Sấy Tiêu Chuẩn', 40000, N'Kg'),
(9, 5, N'Tour Đảo Nửa Ngày', 800000, N'Người'), 
(10, 10, N'Móc Khóa Kỷ Niệm', 50000, N'Cái');
SET IDENTITY_INSERT [dbo].[Services] OFF;
GO
SET IDENTITY_INSERT [dbo].[Order_Services] ON;
INSERT INTO [dbo].[Order_Services] ([id], [booking_detail_id], [total_amount], [status]) VALUES
(1, 1, 0, N'Cancelled'), (2, 2, 200000, N'Delivered'), 
(3, 3, 0, N'Pending'),
(4, 4, 500000, N'Delivered'), (5, 5, 0, N'Pending'), 
(6, 6, 350000, N'Delivered'),
(7, 7, 800000, N'Delivered'), (8, 8, 0, N'Pending'), 
(9, 9, 1000000, N'Delivered'), (10, 10, 150000, N'Delivered');
SET IDENTITY_INSERT [dbo].[Order_Services] OFF;
GO
SET IDENTITY_INSERT [dbo].[Order_Service_Details] ON;
INSERT INTO [dbo].[Order_Service_Details] ([id], [order_service_id], [service_id], [quantity], [unit_price]) VALUES
(1, 2, 2, 1, 150000), 
(2, 2, 10, 1, 50000), 
(3, 4, 3, 1, 500000), 
(4, 6, 5, 1, 350000),
(5, 7, 9, 1, 800000), 
(6, 9, 1, 5, 200000), 
(7, 10, 2, 1, 150000), 
(8, 4, 8, 2, 40000),
(9, 6, 10, 2, 50000), 
(10, 7, 6, 2, 100000);
SET IDENTITY_INSERT [dbo].[Order_Service_Details] OFF;
GO
-- Thanh toán
SET IDENTITY_INSERT [dbo].[Invoices] ON;
INSERT INTO [dbo].[Invoices] ([id], [booking_id], [total_room_amount], [total_service_amount], [discount_amount], [tax_amount], [final_total], [status], [created_by]) VALUES 
(1, 1, 800000, 0, 0, 80000, 880000, N'Paid', 3), 
(2, 2, 2500000, 200000, 250000, 245000, 2695000, N'Unpaid', 3),
(3, 3, 1400000, 0, 0, 140000, 1540000, N'Unpaid', 3), 
(4, 4, 3600000, 0, 100000, 350000, 3850000, N'Unpaid', 3),
(5, 5, 1200000, 0, 0, 120000, 1320000, N'Refunded', 4), 
(6, 6, 3000000, 500000, 0, 350000, 3850000, N'Paid', 4),
(7, 7, 3600000, 0, 540000, 306000, 3366000, N'Unpaid', 4), 
(8, 8, 10000000, 0, 0, 1000000, 11000000, N'Unpaid', 2),
(9, 9, 25000000, 1000000, 0, 2600000, 28600000, N'Paid', 2), 
(10, 10, 16000000, 0, 200000, 1580000, 17380000, N'Unpaid', 2),
(11, 11, 1400000, 0, 0, 140000, 1540000, N'Paid', 2),   
(12, 12, 1800000, 0, 0, 180000, 1980000, N'Paid', 2),
(13, 13, 2400000, 0, 0, 240000, 2640000, N'Paid', 3),
(14, 14, 4500000, 0, 0, 450000, 4950000, N'Paid', 3),
(15, 15, 3600000, 0, 0, 360000, 3960000, N'Paid', 4),
(16, 16, 7500000, 0, 0, 750000, 8250000, N'Paid', 4),
(17, 17, 1000000, 0, 0, 100000, 1100000, N'Paid', 2),
(18, 18, 40000000, 0, 0, 4000000, 44000000, N'Paid', 3);
SET IDENTITY_INSERT [dbo].[Invoices] OFF;
GO
SET IDENTITY_INSERT [dbo].[Payments] ON;
INSERT INTO [dbo].[Payments] ([id], [invoice_id], [payment_method], [amount_paid], [transaction_code]) VALUES
(1, 1, N'Cash', 880000, N'CASH001'), 
(2, 2, N'VNPay', 1000000, N'VNPAY123'),
(3, 3, N'Credit Card', 500000, N'CC456'), 
(4, 4, N'Momo', 3850000, N'MOMO789'),
(5, 5, N'Bank Transfer', 1320000, N'BANK001'), 
(6, 6, N'Cash', 3850000, N'CASH002'),
(7, 7, N'VNPay', 3366000, N'VNPAY999'), 
(8, 8, N'Credit Card', 11000000, N'CC888'),
(9, 9, N'Bank Transfer', 28600000, N'BANK002'), 
(10, 10, N'Momo', 5000000, N'MOMO111'),
(11, 11, N'VNPay', 1540000, N'VNP11'),
(12, 12, N'Cash', 1980000, N'CSH12'),
(13, 13, N'Credit Card', 2640000, N'CC13'),
(14, 14, N'Momo', 4950000, N'MM14'),
(15, 15, N'Bank Transfer', 3960000, N'BT15'),
(16, 16, N'VNPay', 8250000, N'VNP16'),
(17, 17, N'Cash', 1100000, N'CSH17'),
(18, 18, N'Credit Card', 44000000, N'CC18');
SET IDENTITY_INSERT [dbo].[Payments] OFF;
GO
-- Dữ liệu Nhật ký hệ thống (Audit_Logs)
SET IDENTITY_INSERT [dbo].[Audit_Logs] ON;
INSERT INTO [dbo].[Audit_Logs] ([id], [user_id], [action], [table_name], [record_id], [old_value], [new_value]) VALUES
(1, 1, N'UPDATE', N'Rooms', 1, N'{"status":"Cleaning"}', N'{"status":"Available"}'),
(2, 2, N'DELETE', N'Bookings', 5, N'{"id":5}', N'{}'),
(3, 3, N'CREATE', N'Invoices', 1, N'{}', N'{"id":1}'),
(4, 1, N'UPDATE', N'Users', 6, N'{"status":0}', N'{"status":1}'),
(5, 2, N'CREATE', N'Services', 1, N'{}', N'{"price":200000}'),
(6, 3, N'UPDATE', N'Bookings', 2, N'{"status":"Pending"}', N'{"status":"Checked_in"}'),
(7, 1, N'UPDATE', N'Room_Types', 1, N'{"price":350000}', N'{"price":400000}'),
(8, 2, N'DELETE', N'Reviews', 8, N'{"id":8}', N'{}'),
(9, 3, N'CREATE', N'Order_Services', 1, N'{}', N'{"amount":300000}'),
(10, 1, N'UPDATE', N'Vouchers', 1, N'{"limit":50}', N'{"limit":100}');
SET IDENTITY_INSERT [dbo].[Audit_Logs] OFF;
GO
-- ==============================================================================
-- PHẦN 3: THUẬT TOÁN STORED PROCEDURES 
-- ==============================================================================
--1. Thuật toán Tìm phòng bằng Stored Procedure
CREATE PROCEDURE [dbo].[sp_SearchAvailableRooms]
    @CheckIn DATETIME,
    @CheckOut DATETIME,
    @Adults INT = 1,
    @Children INT = 0,
    @RequestedRooms INT = 1,
    @PriceType VARCHAR(20) = 'NIGHTLY', -- 🔥 THÊM THAM SỐ LOẠI GIÁ (NIGHTLY/HOURLY)
    @MinPrice DECIMAL(18,2) = NULL,
    @MaxPrice DECIMAL(18,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- BƯỚC 1: VALIDATE
    IF @CheckIn < CAST(GETDATE() AS DATE)
    BEGIN
        RAISERROR('Ngày Check-in phải từ hôm nay trở đi.', 16, 1);
        RETURN;
    END

    IF @CheckIn >= @CheckOut
    BEGIN
        RAISERROR('Thời gian Check-out phải lớn hơn Check-in.', 16, 1);
        RETURN;
    END

    -- BƯỚC 2: TÍNH THỜI GIAN LƯU TRÚ DỰA TRÊN LOẠI HÌNH
    DECLARE @Duration INT;
    IF @PriceType = 'HOURLY'
    BEGIN
        -- Tính theo giờ (Làm tròn lên, vd: 1 tiếng 15 phút -> tính 2 tiếng)
        SET @Duration = CEILING(CAST(DATEDIFF(MINUTE, @CheckIn, @CheckOut) AS FLOAT) / 60.0);
    END
    ELSE
    BEGIN
        -- Tính theo đêm
        SET @Duration = DATEDIFF(DAY, @CheckIn, @CheckOut);
        IF @Duration = 0 SET @Duration = 1; -- Ít nhất 1 đêm
    END

    -- BƯỚC 3: THỰC THI THUẬT TOÁN
    SELECT 
        rt.id AS RoomTypeId,
        rt.name AS RoomTypeName,
        -- Lấy đúng loại giá dựa trên PriceType
        CASE WHEN @PriceType = 'HOURLY' THEN rt.price_per_hour ELSE rt.base_price END AS PricePerUnit,
        (SELECT TOP 1 image_url FROM [dbo].[Room_Images] ri WHERE ri.room_type_id = rt.id AND ri.is_primary = 1) AS ImageUrl,
        
        -- ĐẾM SỐ PHÒNG VẬT LÝ TRỐNG (Áp dụng De Morgan)
        (
            SELECT COUNT(r.id)
            FROM [dbo].[Rooms] r
            WHERE r.room_type_id = rt.id
              AND r.status = 'Available'
              AND r.id NOT IN (
                  SELECT bd.room_id
                  FROM [dbo].[Booking_Details] bd
                  JOIN [dbo].[Bookings] b ON bd.booking_id = b.id
                  WHERE bd.room_id IS NOT NULL
                    AND b.status != 'Cancelled'
                    AND NOT (bd.check_out_date <= @CheckIn OR bd.check_in_date >= @CheckOut)
              )
        ) AS RemainingRooms,
        
        -- Tính tổng tiền = Thời gian * Giá trị 1 đơn vị * Số phòng
        (@Duration * CASE WHEN @PriceType = 'HOURLY' THEN rt.price_per_hour ELSE rt.base_price END * @RequestedRooms) AS SubTotal
        
    INTO #TempResult
    FROM [dbo].[Room_Types] rt
    WHERE rt.capacity_adults >= @Adults
      AND rt.capacity_children >= @Children
      AND (@MinPrice IS NULL OR (CASE WHEN @PriceType = 'HOURLY' THEN rt.price_per_hour ELSE rt.base_price END) >= @MinPrice)
      AND (@MaxPrice IS NULL OR (CASE WHEN @PriceType = 'HOURLY' THEN rt.price_per_hour ELSE rt.base_price END) <= @MaxPrice);

    -- BƯỚC 4: HIỂN THỊ KẾT QUẢ
    SELECT 
        RoomTypeId,
        RoomTypeName,
        PricePerUnit,
        ImageUrl,
        RemainingRooms,
        SubTotal,
        CAST(CASE WHEN RemainingRooms <= 3 THEN 1 ELSE 0 END AS BIT) AS IsUrgent
    FROM #TempResult
    WHERE RemainingRooms >= @RequestedRooms
    ORDER BY PricePerUnit ASC;

    DROP TABLE #TempResult;
END
GO
-- Thuật toán lấy danh sách Số Phòng Cụ Thể đang trống
CREATE PROCEDURE [dbo].[sp_GetAvailableRoomNumbers]
    @RoomTypeId INT,
    @CheckIn DATETIME,
    @CheckOut DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        r.id AS RoomId, 
        r.room_number AS RoomNumber
    FROM [dbo].[Rooms] r
    WHERE r.room_type_id = @RoomTypeId
      AND r.status = 'Available'
      AND r.id NOT IN (
          SELECT bd.room_id
          FROM [dbo].[Booking_Details] bd
          JOIN [dbo].[Bookings] b ON bd.booking_id = b.id
          WHERE bd.room_id IS NOT NULL 
            AND b.status != 'Cancelled'
            -- Thuật toán loại trừ các phòng đã có người đặt trùng ngày
            AND NOT (bd.check_out_date <= @CheckIn OR bd.check_in_date >= @CheckOut)
      )
END
GO
-- 2. Thuật toán Khóa và Đặt phòng (Lưu đúng cấu trúc applied_price)
CREATE PROCEDURE [dbo].[sp_BookAndLockRooms]
    @BookingId INT,           
    @RoomTypeId INT,          
    @CheckIn DATETIME,
    @CheckOut DATETIME,
    @RequestedRooms INT,      
    @PriceType VARCHAR(20) = 'NIGHTLY' -- 🔥 THÊM THAM SỐ NÀY
AS
BEGIN
    SET NOCOUNT ON;

    -- Biến lưu giá phòng tại thời điểm hiện tại (để Khóa giá)
    DECLARE @CurrentPrice DECIMAL(18,2);
    
    -- Lấy đúng giá tùy theo hình thức thuê
    IF @PriceType = 'HOURLY'
    BEGIN
        SELECT @CurrentPrice = price_per_hour FROM [dbo].[Room_Types] WHERE id = @RoomTypeId;
    END
    ELSE
    BEGIN
        SELECT @CurrentPrice = base_price FROM [dbo].[Room_Types] WHERE id = @RoomTypeId;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @SelectedRooms TABLE (room_id INT);

        -- THUẬT TOÁN TÌM VÀ KHÓA PHÒNG (PESSIMISTIC LOCKING)
        INSERT INTO @SelectedRooms (room_id)
        SELECT TOP (@RequestedRooms) r.id
        FROM [dbo].[Rooms] r WITH (UPDLOCK, READPAST) 
        WHERE r.room_type_id = @RoomTypeId
          AND r.status = 'Available'
          AND r.id NOT IN (
              SELECT bd.room_id
              FROM [dbo].[Booking_Details] bd
              JOIN [dbo].[Bookings] b ON bd.booking_id = b.id
              WHERE bd.room_id IS NOT NULL
                AND b.status != 'Cancelled'
                AND NOT (bd.check_out_date <= @CheckIn OR bd.check_in_date >= @CheckOut)
          );

        DECLARE @AvailableCount INT = (SELECT COUNT(*) FROM @SelectedRooms);

        IF @AvailableCount < @RequestedRooms
        BEGIN
            ROLLBACK TRANSACTION;
            DELETE FROM [dbo].[Bookings] WHERE id = @BookingId;
            RAISERROR('Rất tiếc, không đủ số lượng phòng trống cho loại phòng này trong khoảng thời gian bạn chọn do có người vừa đặt trước.', 16, 1);
            RETURN;
        END

        -- GHI DỮ LIỆU & KHÓA GIÁ (Sử dụng đúng cột applied_price)
        INSERT INTO [dbo].[Booking_Details] (
            booking_id, 
            room_id, 
            room_type_id, 
            check_in_date, 
            check_out_date, 
            applied_price,    -- 🔥 ĐÃ ĐỔI TÊN CỘT
            price_type        -- 🔥 LƯU LOẠI GIÁ
        )
        SELECT 
            @BookingId, 
            room_id, 
            @RoomTypeId, 
            @CheckIn, 
            @CheckOut, 
            @CurrentPrice,    -- Lưu giá đã khóa
            @PriceType        -- Lưu Nightly hay Hourly
        FROM @SelectedRooms;

        COMMIT TRANSACTION;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END
GO
-- ==========================================
-- 4. MODULE AUDIT LOG (Trường Tracking)
-- Chạy Dynamic SQL để tự động thêm updated_at, created_by... cho TẤT CẢ các bảng
-- ==========================================
DECLARE @TableName NVARCHAR(128);
DECLARE @Sql NVARCHAR(MAX);
DECLARE table_cursor CURSOR FOR
SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_name != 'sysdiagrams';

OPEN table_cursor; FETCH NEXT FROM table_cursor INTO @TableName;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @Sql = '';
    
    -- Nếu bảng chưa có created_at thì thêm vào
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(@TableName) AND name = 'created_at')
        SET @Sql = @Sql + 'ALTER TABLE [' + @TableName + '] ADD created_at DATETIME DEFAULT GETDATE(); ';
        
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(@TableName) AND name = 'created_by')
        SET @Sql = @Sql + 'ALTER TABLE [' + @TableName + '] ADD created_by INT NULL; ';
        
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(@TableName) AND name = 'updated_at')
        SET @Sql = @Sql + 'ALTER TABLE [' + @TableName + '] ADD updated_at DATETIME NULL; ';
        
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(@TableName) AND name = 'updated_by')
        SET @Sql = @Sql + 'ALTER TABLE [' + @TableName + '] ADD updated_by INT NULL; ';
        
    IF @Sql <> '' EXEC sp_executesql @Sql;
    FETCH NEXT FROM table_cursor INTO @TableName;
END
CLOSE table_cursor; DEALLOCATE table_cursor;
GO
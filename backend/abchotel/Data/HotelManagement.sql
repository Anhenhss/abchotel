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
	[is_for_new_customer] BIT NOT NULL DEFAULT 0,
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
    [log_type] NVARCHAR(50), 
    [log_data] NVARCHAR(MAX) NOT NULL, 
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
(17, 10, 5, N'Huỳnh Thị Trúc Ly', N'httly20092005@gmail.com', N'0901000010', N'$2a$12$Q7rtMqznJVr3RtIY/F79keNsfy5PR8Tm6B6faYdT/LAE/Woq80e62', 1),
(18, 10, NULL, N'Trần Văn Nam', N'nam@gmail.com', N'0902000001', N'$2a$12$Q7rtMqznJVr3RtIY/F79keNsfy5PR8Tm6B6faYdT/LAE/Woq80e62', 1),
(19, 10, NULL, N'Phan Thị Mai', N'mai@gmail.com', N'0902000002', N'$2a$12$Q7rtMqznJVr3RtIY/F79keNsfy5PR8Tm6B6faYdT/LAE/Woq80e62', 1),
(20, 10, NULL, N'Lê Hoàng Long', N'long@gmail.com', N'0902000003', N'$2a$12$Q7rtMqznJVr3RtIY/F79keNsfy5PR8Tm6B6faYdT/LAE/Woq80e62', 1),
(21, 10, NULL, N'Nguyễn Minh Anh', N'anh@gmail.com', N'0902000004', N'$2a$12$Q7rtMqznJVr3RtIY/F79keNsfy5PR8Tm6B6faYdT/LAE/Woq80e62', 1),
(22, 10, NULL, N'Đỗ Quỳnh Chi', N'chi@gmail.com', N'0902000005', N'$2a$12$Q7rtMqznJVr3RtIY/F79keNsfy5PR8Tm6B6faYdT/LAE/Woq80e62', 1);
SET IDENTITY_INSERT [dbo].[Users] OFF;
GO
GO
-- Tiện ích & Vật tư
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
(10, N'Bàn Làm Việc', N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775076262/abchotel/arcpp7q5oz4h0bzmamkg.png'),
(11, N'View Biển', N'url'),
(12, N'View Thành Phố', N'url'),
(13, N'Bồn Tắm Nằm', N'url'),
(14, N'Dịch Vụ Phòng 24/7', N'url'),
(15, N'Trò Chơi Truyền Hình', N'url'),
(16, N'Bếp Nhỏ', N'url');
SET IDENTITY_INSERT [dbo].[Amenities] OFF;
GO
SET IDENTITY_INSERT [dbo].[Equipments] ON;
INSERT INTO [dbo].[Equipments] ([id], [item_code], [name], [category], [unit], [total_quantity], [in_use_quantity], [damaged_quantity], [liquidated_quantity], [base_price], [default_price_if_lost], [supplier], [is_active], [image_url]) VALUES
(1,'TV-SS-43',N'Smart TV Samsung 43 inch',N'Điện tử',N'Cái',60,50,1,0,7500000,8000000,N'Samsung Vietnam',1,N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775147835/abchotel/sekontj2hjzfhr6eygki.jpg'),
(2,'AC-DK-9000',N'Điều hòa Daikin 9000 BTU',N'Điện tử',N'Cái',60,55,0,0,8200000,9000000,N'Daikin Vietnam',1,N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775147811/abchotel/od88omxgpn2gewxepdip.jpg'),
(3,'MB-AQ-50',N'Tủ lạnh Minibar Aqua 50L',N'Điện tử',N'Cái',40,35,1,0,2500000,3000000,N'Aqua',1,N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775147793/abchotel/k9pkvzaoqhkl038pk7zz.jpg'),
(4,'HD-PN-1000',N'Máy sấy tóc Panasonic 1000W',N'Điện tử',N'Cái',40,35,2,1,450000,600000,N'Điện Máy Xanh',1,N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775147771/abchotel/qmyoa4cwy7npqagf3sbd.jpg'),
(5,'KL-SH-17',N'Ấm đun nước Sunhouse 1.7L',N'Điện tử',N'Cái',40,36,1,1,250000,350000,N'Sunhouse',1,N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775147592/abchotel/vczhrb1xae2s4achqc3d.jpg'),
(6,'TV-SS-55',N'Smart TV Samsung 55 inch',N'Điện tử',N'Cái',5,3,0,0,15000000,17000000,N'Điện Máy Xanh',1,N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775145674/abchotel/dxtsgusaa6vqqaje4i2e.jpg'),
(7,'BED-SG-12',N'Giường Single 1m2 x 2m',N'Nội thất',N'Chiếc',40,35,0,0,5500000,7000000,N'Hòa Phát',1,N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775147567/abchotel/bmndld75tbvlhh7acbjh.jpg'),
(8,'BED-TWIN-12',N'Bộ 2 giường đơn Twin 1m2 x 2m',N'Nội thất',N'Bộ',25,22,0,0,9000000,12000000,N'Hòa Phát',1,NULL),
(9,'BED-DB-18',N'Giường Double 1m8 x 2m',N'Nội thất',N'Chiếc',35,30,0,0,7500000,9000000,N'Hòa Phát',1,NULL),
(10,'BED-KG-22',N'Giường King 2m x 2m2',N'Nội thất',N'Chiếc',20,18,0,0,12000000,15000000,N'Hòa Phát',1,N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775147891/abchotel/efav4xkd2vz1frcljc2f.jpg'),
(11,'WD-AC-01',N'Tủ quần áo gỗ An Cường',N'Nội thất',N'Cái',40,35,0,0,3500000,5000000,N'An Cường',1,N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775146133/abchotel/lkibicpdakkdc2gqp6c4.jpg'),
(12,'TB-HP-01',N'Bàn làm việc Hòa Phát 1m2',N'Nội thất',N'Bộ',40,34,1,0,2200000,3000000,N'Hòa Phát',1,N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775146110/abchotel/snj7eeexxgrjvyuz9tlh.jpg'),
(13,'HG-DT-01',N'Móc treo quần áo Duy Tân',N'Nội thất',N'Chiếc',500,420,10,5,15000,30000,N'Duy Tân',1,N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775146097/abchotel/qujuesi0hzsb7feeafcj.jpg'),
(14,'SAFE-PH-01',N'Két sắt điện tử Philips',N'Điện tử',N'Cái',40,35,0,0,1500000,2000000,N'Philips',1,NULL),
(15,'TW-BT-70',N'Khăn tắm cotton 70x140cm',N'Đồ vải',N'Chiếc',250,180,5,5,85000,150000,N'Thành Công',1,N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775145951/abchotel/lhdgm4ipfatqxingoxgo.jpg'),
(16,'TW-FC-30',N'Khăn mặt cotton 30x30cm',N'Đồ vải',N'Chiếc',250,175,5,5,25000,50000,N'Thành Công',1,N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775145850/abchotel/mze1ksxfvwufy0hcnqxh.jpg'),
(17,'BS-SET-01',N'Bộ ga giường cotton 1m8',N'Đồ vải',N'Bộ',120,100,5,5,150000,300000,N'Thành Công',1,NULL),
(18,'RB-TC-01',N'Áo choàng tắm cotton',N'Đồ vải',N'Chiếc',120,100,3,2,200000,400000,N'Thành Công',1,NULL),
(19,'DR-LV-500',N'Nước suối Lavie 500ml',N'Minibar',N'Chai',800,300,0,0,4000,0,N'Lavie',1,N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775145833/abchotel/mk8ize4lr5dngdj3zbwg.jpg'),
(20,'DR-CC-320',N'Nước ngọt Coca Cola 320ml',N'Minibar',N'Lon',600,250,0,0,7000,20000,N'Coca Cola',1,N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775145819/abchotel/zdkidxk8g14a3limpkkb.jpg'),
(21,'DR-PS-330',N'Nước ngọt Pepsi 330ml',N'Minibar',N'Lon',500,220,0,0,7000,20000,N'Pepsi',1,NULL),
(22,'DR-HB-330',N'Bia Heineken 330ml',N'Minibar',N'Lon',400,200,0,0,16000,35000,N'Heineken',1,N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775145794/abchotel/guk4pazknafewx765fxa.jpg'),
(23,'CF-NC-20',N'Cà phê Nescafe 20g',N'Minibar',N'Gói',700,300,0,0,3000,10000,N'Nescafe',1,NULL),
(24,'SN-OS-50',N'Snack khoai tây Oishi 50g',N'Minibar',N'Gói',600,280,0,0,10000,30000,N'Oishi',1,NULL),
(25,'SN-TT-50',N'Đậu phộng rang Tân Tân 50g',N'Minibar',N'Gói',600,260,0,0,8000,25000,N'Tân Tân',1,NULL),
(26,'TB-CL-01',N'Bàn chải đánh răng Colgate',N'Đồ dùng',N'Chiếc',800,300,0,0,5000,20000,N'Colgate',1,NULL),
(27,'SP-DV-30',N'Sữa tắm Dove 30ml',N'Đồ dùng',N'Chai',800,300,0,0,8000,30000,N'Dove',1,NULL),
(28,'SH-DV-30',N'Dầu gội Dove 30ml',N'Đồ dùng',N'Chai',800,300,0,0,8000,30000,N'Dove',1,NULL),
(29,'PJ-EP-01',N'Máy chiếu Epson EB-X05',N'Phòng họp',N'Cái',6,5,0,0,12000000,15000000,N'Epson',1,NULL),
(30,'MC-SN-01',N'Micro không dây Sony UHF',N'Phòng họp',N'Cái',18,15,1,0,1500000,2500000,N'Sony',1,NULL),
(31,'WB-BK-12',N'Bảng trắng di động Bách Khoa 1m2',N'Phòng họp',N'Cái',6,5,0,0,2000000,3000000,N'Bách Khoa',1,NULL),
(32,'TB-MEET-18',N'Bàn họp Hòa Phát 1m8',N'Phòng họp',N'Cái',15,12,0,0,2500000,4000000,N'Hòa Phát',1,NULL),
(33,'CH-MEET-HP',N'Ghế họp lưng cao Hòa Phát',N'Phòng họp',N'Cái',90,75,3,0,800000,1200000,N'Hòa Phát',1,NULL),
(34,'LED-LG-200',N'Màn hình LED LG 200 inch',N'Hội trường',N'Bộ',2,2,0,0,150000000,200000000,N'LG',1,NULL),
(35,'ST-EV-20',N'Sân khấu di động Event 20m2',N'Hội trường',N'Bộ',2,2,0,0,50000000,70000000,N'Event VN',1,NULL),
(36,'CH-HALL-HP',N'Ghế hội trường Hòa Phát đệm nỉ',N'Hội trường',N'Cái',400,350,10,0,600000,900000,N'Hòa Phát',1,NULL),
(37,'TB-HALL-18',N'Bàn hội trường Hòa Phát 1m8',N'Hội trường',N'Cái',120,100,5,0,1200000,2000000,N'Hòa Phát',1,NULL),
(38,'TE-LP-20',N'Trà Lipton túi lọc 20g',N'Minibar',N'Hộp',300,120,0,0,25000,60000,N'Lipton',1,NULL),
(39,'GL-GL-250',N'Ly thủy tinh Ocean 250ml',N'Đồ dùng',N'Chiếc',500,350,10,5,20000,50000,N'Ocean',1,NULL);
SET IDENTITY_INSERT [dbo].[Equipments] OFF;
GO
-- Phòng
SET IDENTITY_INSERT [dbo].[Room_Types] ON;
INSERT INTO [dbo].[Room_Types]
([id], [name], [base_price], [price_per_hour], [capacity_adults], [capacity_children],
 [size_sqm], [bed_type], [view_direction], [description], [is_active])
VALUES
(1, N'Standard Single', 400000, 40000, 1, 0, 20, N'1 Giường Đơn', N'View hồ bơi', N'Phòng tiêu chuẩn giường đơn', 1),
(2, N'Standard Double', 500000, 50000, 2, 1, 25, N'1 Giường Đôi', N'View hồ bơi', N'Phòng tiêu chuẩn giường đôi', 1),
(3, N'Superior', 650000, 65000, 2, 1, 28, N'2 Giường Đơn', N'View hồ bơi', N'Phòng nâng cấp', 1),
(4, N'Deluxe City View', 850000, 85000, 2, 2, 32, N'1 Đôi + 1 Đơn', N'City', N'Phòng deluxe cao cấp hướng thành phố', 1),
(5, N'Deluxe Ocean View', 1000000, 100000, 2, 2, 35, N'1 Đôi + 1 Đơn', N'Ocean', N'Phòng deluxe cao cấp Phòng hướng biển', 1),
(6, N'Family Room', 1400000, 140000, 4, 2, 45, N'2 Giường Đôi', N'City', N'Phòng gia đình', 1),
(7, N'Junior Suite', 1700000, 170000, 2, 2, 50, N'2 Giường Đôi', N'City', N'Suite nhỏ', 1),
(8, N'Presidential Suite', 5000000, 500000, 4, 2, 120, N'2 Giường Đôi', N'Ocean', N'Phòng tổng thống siêu sang', 1),
(9, N'Meeting Room', 300000, 300000, 10, 0, 40, N'Không giường', N'City', N'Phòng họp nhỏ', 1),
(10, N'Conference Hall', 1000000, 1000000, 50, 0, 150, N'Không giường', N'City', N'Hội trường lớn', 1);
SET IDENTITY_INSERT [dbo].[Room_Types] OFF;
GO
SET IDENTITY_INSERT [dbo].[Rooms] ON;
INSERT INTO [dbo].[Rooms]
([id], [room_type_id], [room_number], [floor], [status], [cleaning_status], [is_active])VALUES
-- ===== TYPE 1 =====
(1,1,N'101',1,N'Available',N'Clean',1),
(2,1,N'102',1,N'Available',N'Clean',1), 
(3,1,N'103',1,N'Available',N'Dirty',1),
(4,1,N'104',1,N'Available',N'Clean',1),
(5,1,N'105',1,N'Maintenance',N'Dirty',1),

-- ===== TYPE 2 =====
(6,2,N'201',2,N'Available',N'Clean',1),
(7,2,N'202',2,N'Available',N'Clean',1),
(8,2,N'203',2,N'Available',N'Dirty',1), -- sẽ dùng 6/2026
(9,2,N'204',2,N'Available',N'Clean',1),
(10,2,N'205',2,N'Maintenance',N'Dirty',1),

-- ===== TYPE 3 =====
(11,3,N'301',3,N'Available',N'Clean',1),
(12,3,N'302',3,N'Available',N'Clean',1),
(13,3,N'303',3,N'Available',N'Dirty',1),
(14,3,N'304',3,N'Available',N'Clean',1),
(15,3,N'305',3,N'Maintenance',N'Dirty',1),

-- ===== TYPE 4 =====
(16,4,N'401',4,N'Available',N'Clean',1),
(17,4,N'402',4,N'Available',N'Clean',1),
(18,4,N'403',4,N'Available',N'Dirty',1),
(19,4,N'404',4,N'Available',N'Clean',1),
(20,4,N'405',4,N'Maintenance',N'Dirty',1),

-- ===== TYPE 5 =====
(21,5,N'501',5,N'Available',N'Clean',1),
(22,5,N'502',5,N'Available',N'Clean',1),
(23,5,N'503',5,N'Available',N'Dirty',1),
(24,5,N'504',5,N'Available',N'Clean',1),
(25,5,N'505',5,N'Maintenance',N'Dirty',1),

-- ===== TYPE 6 =====
(26,6,N'601',6,N'Available',N'Clean',1),
(27,6,N'602',6,N'Available',N'Clean',1),
(28,6,N'603',6,N'Available',N'Dirty',1),
(29,6,N'604',6,N'Available',N'Clean',1),
(30,6,N'605',6,N'Maintenance',N'Dirty',1),

-- ===== TYPE 7 =====
(31,7,N'701',7,N'Available',N'Clean',1),
(32,7,N'702',7,N'Available',N'Clean',1),
(33,7,N'703',7,N'Available',N'Dirty',1),
(34,7,N'704',7,N'Available',N'Clean',1),
(35,7,N'705',7,N'Maintenance',N'Dirty',1),

-- ===== TYPE 8 =====
(36,8,N'801',8,N'Available',N'Clean',1),
(37,8,N'802',8,N'Available',N'Clean',1),
(38,8,N'803',8,N'Available',N'Dirty',1),

-- ===== MEETING =====
(39,9,N'MR-01',1,N'Available',N'Clean',1),
(40,9,N'MR-02',1,N'Available',N'Clean',1),
(41,9,N'MR-03',1,N'Available',N'Clean',1),

-- ===== HALL =====
(42,10,N'HALL-01',1,N'Available',N'Clean',1),
(43,10,N'HALL-02',1,N'Maintenance',N'Dirty',1);

SET IDENTITY_INSERT [dbo].[Rooms] OFF;
GO
-- Xóa sạch dữ liệu cũ của bảng Room_Inventory để làm lại cho chuẩn
DELETE FROM [dbo].[Room_Inventory];
GO

SET IDENTITY_INSERT [dbo].[Room_Inventory] ON;
INSERT INTO [dbo].[Room_Inventory] 
([id], [room_id], [equipmentId], [quantity], [price_if_lost], [is_active], [note]) VALUES

-- =========================================================================
-- PHÒNG 101 (ROOM ID: 1) - STANDARD SINGLE (Hạng 1)
-- =========================================================================
(1, 1, 1, 1, 8000000.00, 1, N'Treo tường, kèm remote'), -- TV 43 inch
(2, 1, 2, 1, 9000000.00, 1, N'Điều hòa 9000 BTU'),
(3, 1, 3, 1, 3000000.00, 1, N'Minibar đặt dưới kệ'),
(4, 1, 4, 1, 600000.00, 1, N'Máy sấy tóc trong tủ kính'),
(5, 1, 5, 1, 350000.00, 1, N'Ấm siêu tốc'),
(6, 1, 7, 1, 7000000.00, 1, N'Giường Single'),
(7, 1, 11, 1, 5000000.00, 1, N'Tủ quần áo'),
(8, 1, 12, 1, 3000000.00, 1, N'Bàn làm việc'),
(9, 1, 13, 5, 30000.00, 1, N'Móc treo quần áo'),
(10, 1, 15, 1, 150000.00, 1, N'Khăn tắm'),
(11, 1, 16, 1, 50000.00, 1, N'Khăn mặt'),
(12, 1, 17, 1, 300000.00, 1, N'Ga giường'),
(13, 1, 19, 2, 0.00, 1, N'Nước suối miễn phí hằng ngày'),

-- =========================================================================
-- PHÒNG 201 (ROOM ID: 6) - STANDARD DOUBLE (Hạng 2)
-- =========================================================================
(14, 6, 1, 1, 8000000.00, 1, N'TV 43 inch'),
(15, 6, 2, 1, 9000000.00, 1, N'Điều hòa'),
(16, 6, 3, 1, 3000000.00, 1, N'Minibar'),
(17, 6, 4, 1, 600000.00, 1, N'Máy sấy tóc'),
(18, 6, 5, 1, 350000.00, 1, N'Ấm siêu tốc'),
(19, 6, 9, 1, 9000000.00, 1, N'Giường Double'),
(20, 6, 11, 1, 5000000.00, 1, N'Tủ quần áo'),
(21, 6, 12, 1, 3000000.00, 1, N'Bàn làm việc'),
(22, 6, 13, 6, 30000.00, 1, N'Móc treo'),
(23, 6, 15, 2, 150000.00, 1, N'Khăn tắm'),
(24, 6, 16, 2, 50000.00, 1, N'Khăn mặt'),
(25, 6, 17, 1, 300000.00, 1, N'Bộ ga giường'),
(26, 6, 19, 2, 0.00, 1, N'Nước suối miễn phí'),
(27, 6, 20, 2, 20000.00, 1, N'Coca Cola (Minibar)'),

-- =========================================================================
-- PHÒNG 301 (ROOM ID: 11) - SUPERIOR TWIN (Hạng 3)
-- =========================================================================
(28, 11, 1, 1, 8000000.00, 1, N'TV 43 inch'),
(29, 11, 2, 1, 9000000.00, 1, N'Điều hòa'),
(30, 11, 3, 1, 3000000.00, 1, N'Minibar'),
(31, 11, 4, 1, 600000.00, 1, N'Máy sấy'),
(32, 11, 5, 1, 350000.00, 1, N'Ấm đun nước'),
(33, 11, 8, 1, 12000000.00, 1, N'Bộ 2 Giường Đơn Twin'),
(34, 11, 11, 1, 5000000.00, 1, N'Tủ quần áo lớn'),
(35, 11, 12, 1, 3000000.00, 1, N'Bàn làm việc'),
(36, 11, 13, 6, 30000.00, 1, N'Móc áo'),
(37, 11, 15, 2, 150000.00, 1, N'Khăn tắm'),
(38, 11, 16, 2, 50000.00, 1, N'Khăn mặt'),
(39, 11, 17, 2, 300000.00, 1, N'2 Bộ ga giường'),
(40, 11, 19, 2, 0.00, 1, N'Nước suối miễn phí'),

-- =========================================================================
-- PHÒNG 401 (ROOM ID: 16) - DELUXE CITY VIEW (Hạng 4)
-- =========================================================================
(41, 16, 1, 1, 8000000.00, 1, N'TV 43 inch'),
(42, 16, 2, 1, 9000000.00, 1, N'Điều hòa'),
(43, 16, 3, 1, 3000000.00, 1, N'Minibar'),
(44, 16, 4, 1, 600000.00, 1, N'Máy sấy'),
(45, 16, 5, 1, 350000.00, 1, N'Ấm siêu tốc'),
(46, 16, 14, 1, 2000000.00, 1, N'Két sắt điện tử Philips'),
(47, 16, 9, 1, 9000000.00, 1, N'Giường Đôi'),
(48, 16, 7, 1, 7000000.00, 1, N'Giường Đơn (phòng ghép)'),
(49, 16, 11, 1, 5000000.00, 1, N'Tủ quần áo'),
(50, 16, 12, 1, 3000000.00, 1, N'Bàn làm việc'),
(51, 16, 13, 8, 30000.00, 1, N'Móc áo'),
(52, 16, 15, 3, 150000.00, 1, N'Khăn tắm'),
(53, 16, 16, 3, 50000.00, 1, N'Khăn mặt'),
(54, 16, 17, 2, 300000.00, 1, N'Ga giường'),
(55, 16, 18, 3, 400000.00, 1, N'Áo choàng tắm cao cấp'),
(56, 16, 19, 3, 0.00, 1, N'Nước suối miễn phí'),
(57, 16, 22, 2, 35000.00, 1, N'Heineken (Minibar)'),

-- =========================================================================
-- PHÒNG 501 (ROOM ID: 21) - DELUXE OCEAN VIEW (Hạng 5)
-- =========================================================================
(58, 21, 6, 1, 17000000.00, 1, N'Smart TV 55 inch (Nâng cấp)'),
(59, 21, 2, 1, 9000000.00, 1, N'Điều hòa'),
(60, 21, 3, 1, 3000000.00, 1, N'Minibar'),
(61, 21, 4, 1, 600000.00, 1, N'Máy sấy'),
(62, 21, 5, 1, 350000.00, 1, N'Ấm siêu tốc'),
(63, 21, 14, 1, 2000000.00, 1, N'Két sắt'),
(64, 21, 9, 1, 9000000.00, 1, N'Giường Đôi'),
(65, 21, 7, 1, 7000000.00, 1, N'Giường Đơn'),
(66, 21, 11, 1, 5000000.00, 1, N'Tủ quần áo'),
(67, 21, 12, 1, 3000000.00, 1, N'Bàn làm việc'),
(68, 21, 13, 8, 30000.00, 1, N'Móc treo'),
(69, 21, 15, 3, 150000.00, 1, N'Khăn tắm'),
(70, 21, 16, 3, 50000.00, 1, N'Khăn mặt'),
(71, 21, 17, 2, 300000.00, 1, N'Ga giường'),
(72, 21, 18, 3, 400000.00, 1, N'Áo choàng tắm'),
(73, 21, 19, 3, 0.00, 1, N'Nước suối miễn phí'),

-- =========================================================================
-- PHÒNG 601 (ROOM ID: 26) - FAMILY ROOM (Hạng 6)
-- =========================================================================
(74, 26, 6, 1, 17000000.00, 1, N'Smart TV 55 inch'),
(75, 26, 2, 2, 9000000.00, 1, N'2 Điều hòa cho phòng rộng'),
(76, 26, 3, 1, 3000000.00, 1, N'Minibar'),
(77, 26, 4, 1, 600000.00, 1, N'Máy sấy'),
(78, 26, 5, 1, 350000.00, 1, N'Ấm siêu tốc'),
(79, 26, 14, 1, 2000000.00, 1, N'Két sắt'),
(80, 26, 9, 2, 9000000.00, 1, N'2 Giường Đôi'),
(81, 26, 11, 2, 5000000.00, 1, N'2 Tủ quần áo'),
(82, 26, 12, 1, 3000000.00, 1, N'Bàn làm việc lớn'),
(83, 26, 13, 10, 30000.00, 1, N'Móc áo'),
(84, 26, 15, 4, 150000.00, 1, N'Khăn tắm'),
(85, 26, 16, 4, 50000.00, 1, N'Khăn mặt'),
(86, 26, 17, 2, 300000.00, 1, N'Ga giường'),
(87, 26, 18, 4, 400000.00, 1, N'Áo choàng tắm'),
(88, 26, 19, 4, 0.00, 1, N'Nước suối miễn phí'),

-- =========================================================================
-- PHÒNG 701 (ROOM ID: 31) - JUNIOR SUITE (Hạng 7)
-- =========================================================================
(89, 31, 6, 1, 17000000.00, 1, N'Smart TV 55 inch'),
(90, 31, 2, 2, 9000000.00, 1, N'2 Điều hòa'),
(91, 31, 3, 1, 3000000.00, 1, N'Minibar'),
(92, 31, 4, 1, 600000.00, 1, N'Máy sấy'),
(93, 31, 5, 1, 350000.00, 1, N'Ấm siêu tốc'),
(94, 31, 14, 1, 2000000.00, 1, N'Két sắt'),
(95, 31, 9, 2, 9000000.00, 1, N'2 Giường Đôi'),
(96, 31, 11, 2, 5000000.00, 1, N'2 Tủ quần áo'),
(97, 31, 12, 1, 3000000.00, 1, N'Bàn làm việc doanh nhân'),
(98, 31, 13, 10, 30000.00, 1, N'Móc áo gỗ'),
(99, 31, 15, 4, 150000.00, 1, N'Khăn tắm dày'),
(100, 31, 16, 4, 50000.00, 1, N'Khăn mặt'),
(101, 31, 17, 2, 300000.00, 1, N'Ga giường lụa'),
(102, 31, 18, 4, 400000.00, 1, N'Áo choàng tắm lụa'),
(103, 31, 19, 4, 0.00, 1, N'Nước suối miễn phí'),

-- =========================================================================
-- PHÒNG 801 (ROOM ID: 36) - PRESIDENTIAL SUITE (Hạng 8 - VIP)
-- =========================================================================
(104, 36, 6, 2, 17000000.00, 1, N'2 Smart TV 55 inch (Phòng khách + Phòng ngủ)'),
(105, 36, 2, 3, 9000000.00, 1, N'3 Điều hòa trung tâm'),
(106, 36, 3, 2, 3000000.00, 1, N'2 Minibar (Rượu + Nước)'),
(107, 36, 4, 2, 600000.00, 1, N'2 Máy sấy'),
(108, 36, 5, 2, 350000.00, 1, N'2 Ấm siêu tốc'),
(109, 36, 14, 2, 2000000.00, 1, N'2 Két sắt'),
(110, 36, 10, 2, 15000000.00, 1, N'2 Giường King Size 2m x 2m2'),
(111, 36, 11, 3, 5000000.00, 1, N'3 Tủ quần áo lớn'),
(112, 36, 12, 2, 3000000.00, 1, N'Bàn làm việc cao cấp'),
(113, 36, 13, 15, 30000.00, 1, N'Móc áo gỗ cao cấp'),
(114, 36, 15, 6, 150000.00, 1, N'Khăn tắm lớn'),
(115, 36, 16, 6, 50000.00, 1, N'Khăn mặt'),
(116, 36, 17, 2, 300000.00, 1, N'Ga giường tơ tằm'),
(117, 36, 18, 6, 400000.00, 1, N'Áo choàng nhung'),
(118, 36, 19, 6, 0.00, 1, N'Nước khoáng nhập khẩu'),
(119, 36, 22, 6, 35000.00, 1, N'Bia Heineken (Minibar)'),

-- =========================================================================
-- PHÒNG MR-01 (ROOM ID: 39) - MEETING ROOM (Hạng 9)
-- =========================================================================
(120, 39, 2, 2, 9000000.00, 1, N'2 Điều hòa'),
(121, 39, 29, 1, 15000000.00, 1, N'Máy chiếu Epson'),
(122, 39, 30, 2, 2500000.00, 1, N'Micro không dây Sony'),
(123, 39, 31, 1, 3000000.00, 1, N'Bảng trắng di động'),
(124, 39, 32, 1, 4000000.00, 1, N'Bàn họp Hòa Phát'),
(125, 39, 33, 10, 1200000.00, 1, N'Ghế họp bọc da'),
(126, 39, 39, 10, 50000.00, 1, N'Ly thủy tinh uống nước'),
(127, 39, 19, 10, 0.00, 1, N'Nước suối Lavie trên bàn'),

-- =========================================================================
-- PHÒNG HALL-01 (ROOM ID: 42) - CONFERENCE HALL (Hạng 10)
-- =========================================================================
(128, 42, 2, 4, 9000000.00, 1, N'4 Điều hòa trung tâm'),
(129, 42, 34, 1, 200000000.00, 1, N'Màn hình LED 200 inch'),
(130, 42, 35, 1, 70000000.00, 1, N'Sân khấu di động'),
(131, 42, 30, 4, 2500000.00, 1, N'4 Micro không dây'),
(132, 42, 37, 10, 2000000.00, 1, N'10 Bàn hội trường (Dãy đầu)'),
(133, 42, 36, 50, 900000.00, 1, N'50 Ghế hội trường nỉ đỏ'),
(134, 42, 39, 50, 50000.00, 1, N'Ly thủy tinh'),
(135, 42, 19, 50, 0.00, 1, N'Nước suối');

SET IDENTITY_INSERT [dbo].[Room_Inventory] OFF;
GO
INSERT INTO [dbo].[RoomType_Amenities] ([room_type_id], [amenity_id]) VALUES
-- 1. Standard Single (Tiêu chuẩn cơ bản + View Thành phố)
(1, 1), (1, 2), (1, 3), (1, 6), (1, 8), (1, 12),

-- 2. Standard Double (Giống Single nhưng cho 2 người)
(2, 1), (2, 2), (2, 3), (2, 6), (2, 8), (2, 12),

-- 3. Superior (Nâng cấp không gian, thêm Bàn làm việc và Két sắt)
(3, 1), (3, 2), (3, 3), (3, 6), (3, 7), (3, 8), (3, 10), (3, 12),

-- 4. Deluxe City View (Có Bồn tắm sứ, Ban công hướng phố)
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6), (4, 7), (4, 8), (4, 10), (4, 12),

-- 5. Deluxe Ocean View (Giống Deluxe City nhưng View Biển)
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6), (5, 7), (5, 8), (5, 10), (5, 11),

-- 6. Family Room (Ưu tiên gia đình: Thêm Bếp nhỏ, Trò chơi TV)
(6, 1), (6, 2), (6, 3), (6, 4), (6, 6), (6, 7), (6, 8), (6, 12), (6, 15), (6, 16),

-- 7. Junior Suite (Sang trọng: Có Dịch vụ 24/7, Máy pha Cà phê)
(7, 1), (7, 2), (7, 3), (7, 4), (7, 5), (7, 6), (7, 7), (7, 8), (7, 9), (7, 10), (7, 12), (7, 14),

-- 8. Presidential Suite (Trùm cuối: Có TẤT CẢ mọi thứ cao cấp nhất, Bồn tắm nằm xịn, View Biển)
(8, 1), (8, 2), (8, 3), (8, 5), (8, 6), (8, 7), (8, 8), (8, 9), (8, 10), (8, 11), (8, 13), (8, 14), (8, 15), (8, 16),

-- 9. Meeting Room (Phòng họp: Rất gọn gàng, chủ yếu công năng)
(9, 1), (9, 3), (9, 9), (9, 10), -- (Wifi, Điều hòa, Máy pha cafe, Bàn làm việc)

-- 10. Conference Hall (Hội trường: Chỉ cần mạng mạnh và mát mẻ)
(10, 1), (10, 3); -- (Wifi, Điều hòa)
GO
SET IDENTITY_INSERT [dbo].[Room_Images] ON;

INSERT INTO [dbo].[Room_Images]
([id], [room_type_id], [image_url], [is_primary], [is_active], [created_at], [created_by], [updated_at], [updated_by])
VALUES
-- Room Type 1
(1, 1, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775058971/abchotel/j8qzhwycc1qpkattxmfz.jpg', 1, 1, '2026-04-01T22:56:12.417', NULL, NULL, NULL),
(2, 1, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775059269/abchotel/fmauuypbyjedul2hem1p.jpg', 0, 1, '2026-04-01T22:56:23.477', NULL, NULL, NULL),
(3, 1, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775059005/abchotel/j07vv0vtttzedzdrs0bg.jpg', 0, 1, '2026-04-01T22:56:46.790', NULL, NULL, NULL),

-- Room Type 2
(4, 2, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775059252/abchotel/oeygfktr8ak12lp8xmfn.jpg', 1, 1, '2026-04-01T23:00:53.823', NULL, NULL, NULL),
(5, 2, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775059269/abchotel/fmauuypbyjedul2hem1p.jpg', 0, 1, '2026-04-01T23:01:10.183', NULL, NULL, NULL),
(6, 2, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775059279/abchotel/cetdu8av7lkarmin3xxi.jpg', 0, 1, '2026-04-01T23:01:20.690', NULL, NULL, NULL),

-- Room Type 3
(7, 3, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775057898/abchotel/yaruy1sorcoip3uzfrtb.jpg', 1, 1, '2026-04-01T22:38:19.930', NULL, NULL, NULL),
(8, 3, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775057915/abchotel/ibenivntrzhxtcxcydjy.jpg', 0, 1, '2026-04-01T22:38:36.987', NULL, NULL, NULL),
(9, 3, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775054031/abchotel/bwcf0hyfhabgdkmaixxo.jpg', 0, 1, '2026-04-01T22:38:46.373', NULL, NULL, NULL),

-- Room Type 4
(10, 4, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775058066/abchotel/fxdakpiurrp0ycjixcu4.jpg', 1, 1, '2026-04-01T21:32:31.733', NULL, NULL, NULL),
(11, 4, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775061734/abchotel/djqpllmnknw5ksusrd2f.jpg', 0, 1, '2026-04-01T21:33:40.007', NULL, NULL, NULL),
(12, 4, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775057924/abchotel/vs5gwxffxl6u2bcpefj8.jpg', 0, 1, '2026-04-01T21:33:54.437', NULL, NULL, NULL),

-- Room Type 5
(13, 5, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775053950/abchotel/d5gdmk8o0p5h9qrgwrbi.jpg', 1, 1, '2026-04-01T23:24:43.233', NULL, NULL, NULL),
(14, 5, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775061734/abchotel/djqpllmnknw5ksusrd2f.jpg', 0, 1, '2026-04-01T23:25:07.540', NULL, NULL, NULL),
(15, 5, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775061658/abchotel/dpba6hsjd5vo8wnw3rep.jpg', 0, 1, '2026-04-01T23:25:22.727', NULL, NULL, NULL),

-- Room Type 6
(16, 6, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775060070/abchotel/face5dkumiff3xcckml0.jpg', 1, 1, '2026-04-01T23:14:32.873', NULL, NULL, NULL),
(17, 6, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775060088/abchotel/spaxkhfnes5guyuuj2bf.jpg', 0, 1, '2026-04-01T23:14:50.610', NULL, NULL, NULL),
(18, 6, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775060133/abchotel/b4it7djpgpzxbhotfqa8.jpg', 0, 1, '2026-04-01T23:15:35.060', NULL, NULL, NULL),

-- Room Type 7
(19, 7, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775060681/abchotel/iiszfn7eqhhwd4rwhvpg.jpg', 1, 1, '2026-04-01T23:42:31.843', NULL, NULL, NULL),
(20, 7, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775060706/abchotel/wkpqw9gutsuiaewmbtak.jpg', 0, 1, '2026-04-01T23:40:59.327', NULL, NULL, NULL),
(21, 7, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775060722/abchotel/vcrjjsmozgzkutcoshbg.jpg', 0, 1, '2026-04-01T23:42:14.513', NULL, NULL, NULL),

-- Room Type 8
(22, 8, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775060198/abchotel/yu7faahxu52q7cuntusm.jpg', 1, 1, '2026-04-01T23:23:44.140', NULL, NULL, NULL),
(23, 8, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775060234/abchotel/rjd8bzs4hvl7kws5vvup.jpg', 0, 1, '2026-04-01T23:21:56.560', NULL, NULL, NULL),
(24, 8, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775060254/abchotel/xtdkktn8snmn3xldzojt.jpg', 0, 1, '2026-04-01T23:22:10.370', NULL, NULL, NULL),

-- Room Type 9
(25, 9, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1776177004/abchotel/shlwlomgpu4oyxq4pbfh.jpg', 1, 1, '2026-04-01T23:16:40.597', NULL, NULL, NULL),
(26, 9, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1776176995/abchotel/hymwn9k9933z9lsvwvkv.jpg', 0, 1, '2026-04-01T23:17:15.907', NULL, NULL, NULL),
(27, 9, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1776177013/abchotel/wvveqru3svgjgtosdcjv.jpg', 0, 1, '2026-04-01T23:17:34.970', NULL, NULL, NULL),

-- Room Type 10
(28, 10, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1776176973/abchotel/xghgaeejyglsnusd3mvb.jpg', 1, 1, '2026-04-01T22:40:48.793', NULL, NULL, NULL),
(29, 10, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1776176955/abchotel/vgeqdtqvo0f12mzlydfy.jpg', 0, 1, '2026-04-01T22:41:07.453', NULL, NULL, NULL),
(30, 10, N'https://res.cloudinary.com/dngyxxwul/image/upload/v1776176983/abchotel/cpgek83po3emg3zsdy2a.jpg', 0, 1, '2026-04-01T22:41:18.240', NULL, NULL, NULL);
SET IDENTITY_INSERT [dbo].[Room_Images] OFF;
GO
-- Bài viết
SET IDENTITY_INSERT [dbo].[Article_Categories] ON;
INSERT INTO [dbo].[Article_Categories] ([id], [name], [slug]) VALUES 
(1, N'Tin tức & Ưu đãi', 'tin-tuc-uu-dai'),
(2, N'Cẩm nang du lịch Đà Nẵng', 'cam-nang-du-lich-da-nang'),
(3, N'Ẩm thực & Trải nghiệm', 'am-thuc-trai-nghiem'),
(4, N'Hướng dẫn & Thông tin', 'huong-dan-thong-tin');
SET IDENTITY_INSERT [dbo].[Article_Categories] OFF;
GO
SET IDENTITY_INSERT [dbo].[Articles] ON;
INSERT INTO [dbo].[Articles] 
([id], [category_id], [author_id], [title], [slug], [short_description], [content], [thumbnail_url], [published_at]) 
VALUES 

-- 1. Tin tức & ưu đãi
(1, 1, 1, N'Khai trương hồ bơi vô cực view biển Mỹ Khê', N'ho-boi-vo-cuc-my-khe',
N'Trải nghiệm hồ bơi vô cực với tầm nhìn trực diện biển Mỹ Khê cực chill.',
NULL,
N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775068010/abchotel/zhiqb8waywm93dtx0vkh.jpg',
'2026-03-01'),

(2, 1, 2, N'Ưu đãi mùa hè 2026 - Combo nghỉ dưỡng 3N2Đ', N'uu-dai-mua-he-2026',
N'Combo trọn gói bao gồm phòng + buffet sáng + xe đưa đón sân bay.',
NULL,
N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775068210/abchotel/w72i22sz0gycbuaseah3.jpg',
'2026-03-02'),

-- 2. Cẩm nang du lịch
(3, 2, 2, N'Top 5 địa điểm gần khách sạn bạn nên ghé', N'top-dia-diem-da-nang',
N'Các điểm check-in nổi bật như Bà Nà Hills, Cầu Rồng, Ngũ Hành Sơn.',
NULL,
N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775051779/abchotel/pygtbkrdfkaqmvolf7yg.jpg',
'2026-03-03'),

(4, 2, 3, N'Lịch trình 2 ngày 1 đêm tại Đà Nẵng', N'lich-trinh-2n1d-da-nang',
N'Gợi ý lịch trình tiết kiệm thời gian cho khách du lịch ngắn ngày.',
NULL,
N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775068239/abchotel/ffyi4wyufzjs8uzrvwuu.jpg',
'2026-03-04'),

(5, 2, 1, N'Khám phá bán đảo Sơn Trà từ A-Z', N'ban-dao-son-tra',
N'Điểm đến thiên nhiên nổi bật với chùa Linh Ứng và voọc chà vá.',
NULL,
N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775068225/abchotel/hsr1vvx2axblkl4rh6rd.jpg',
'2026-03-05'),

-- 3. Ẩm thực & trải nghiệm
(6, 3, 3, N'Ăn gì ở Đà Nẵng? 7 món nhất định phải thử', N'am-thuc-da-nang',
N'Mì Quảng, bún chả cá, bánh tráng cuốn thịt heo...',
NULL,
N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775068189/abchotel/yumqrqbadves92v1idpu.jpg',
'2026-03-06'),

(7, 3, 1, N'Trải nghiệm tiệc BBQ ngoài trời bên biển', N'bbq-ben-bien',
N'Tận hưởng bữa tối lãng mạn với hải sản tươi sống.',
NULL,
N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775051977/abchotel/jjjmgilirxampfayomat.jpg',
'2026-03-07'),

-- 4. Hướng dẫn & thông tin
(8, 4, 2, N'Hướng dẫn đi từ sân bay Đà Nẵng về khách sạn', N'di-chuyen-san-bay',
N'Chi tiết taxi, Grab, xe đưa đón tiện lợi.',
NULL,
N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775051887/abchotel/dwravtzojerdio4y19ix.jpg',
'2026-03-08'),

(9, 4, 3, N'Giờ check-in và quy định khách sạn', N'checkin-checkout',
N'Những thông tin quan trọng khách cần biết trước khi đặt phòng.',
NULL,
N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775051909/abchotel/sauxn5rb0if3ouxjlder.jpg',
'2026-03-09'),

(10, 4, 1, N'Kinh nghiệm du lịch Đà Nẵng mùa mưa', N'du-lich-mua-mua',
N'Những lưu ý giúp chuyến đi vẫn trọn vẹn dù thời tiết xấu.',
NULL,
N'https://res.cloudinary.com/dngyxxwul/image/upload/v1775068254/abchotel/ynnbbgulwukdogjhgpgj.jpg',
'2026-03-10');

SET IDENTITY_INSERT [dbo].[Articles] OFF;
GO
-- Điểm du lịch
SET IDENTITY_INSERT [dbo].[Attractions] ON;
INSERT INTO [dbo].[Attractions] 
([id], [name], [distance_km], [description], [address], [latitude], [longitude], [map_embed_link]) 
VALUES 

(1, N'Bãi biển Mỹ Khê', 0.50, 
N'Một trong những bãi biển đẹp nhất hành tinh với cát trắng và nước biển trong xanh.', 
N'Đường Võ Nguyên Giáp, Sơn Trà, Đà Nẵng', 
16.0544, 108.2470, 
N'https://maps.google.com/maps?q=16.0544,108.2470&z=15&output=embed'),

(2, N'Cầu Rồng', 2.50, 
N'Biểu tượng của Đà Nẵng, nổi bật với màn phun lửa và nước vào cuối tuần.', 
N'Nguyễn Văn Linh, Hải Châu, Đà Nẵng', 
16.0617, 108.2270, 
N'https://maps.google.com/maps?q=16.0617,108.2270&z=15&output=embed'),

(3, N'Cầu Tình Yêu', 2.70, 
N'Địa điểm check-in lãng mạn bên sông Hàn với nhiều ổ khóa tình yêu.', 
N'Trần Hưng Đạo, Sơn Trà, Đà Nẵng', 
16.0610, 108.2290, 
N'https://maps.google.com/maps?q=16.0610,108.2290&z=15&output=embed'),

(4, N'Ngũ Hành Sơn', 8.00, 
N'Danh thắng nổi tiếng với hệ thống hang động và chùa chiền linh thiêng.', 
N'81 Huyền Trân Công Chúa, Ngũ Hành Sơn, Đà Nẵng', 
15.9965, 108.2640, 
N'https://maps.google.com/maps?q=15.9965,108.2640&z=15&output=embed'),

(5, N'Bán đảo Sơn Trà', 10.00, 
N'Khu bảo tồn thiên nhiên với cảnh quan hoang sơ và chùa Linh Ứng nổi tiếng.', 
N'Thọ Quang, Sơn Trà, Đà Nẵng', 
16.1139, 108.2772, 
N'https://maps.google.com/maps?q=16.1139,108.2772&z=15&output=embed'),

(6, N'Chùa Linh Ứng (Sơn Trà)', 11.00, 
N'Ngôi chùa nổi tiếng với tượng Phật Quan Âm cao nhất Việt Nam.', 
N'Hoàng Sa, Sơn Trà, Đà Nẵng', 
16.1090, 108.2775, 
N'https://maps.google.com/maps?q=16.1090,108.2775&z=15&output=embed'),

(7, N'Bà Nà Hills', 25.00, 
N'Khu du lịch nổi tiếng với Cầu Vàng và khí hậu mát mẻ quanh năm.', 
N'Hòa Ninh, Hòa Vang, Đà Nẵng', 
15.9950, 107.9886, 
N'https://maps.google.com/maps?q=15.9950,107.9886&z=15&output=embed'),

(8, N'Chợ Hàn', 3.00, 
N'Khu chợ truyền thống nổi tiếng với đặc sản và quà lưu niệm.', 
N'119 Trần Phú, Hải Châu, Đà Nẵng', 
16.0678, 108.2230, 
N'https://maps.google.com/maps?q=16.0678,108.2230&z=15&output=embed'),

(9, N'Asia Park - Sun World', 4.50, 
N'Công viên giải trí với vòng quay Sun Wheel khổng lồ.', 
N'01 Phan Đăng Lưu, Hải Châu, Đà Nẵng', 
16.0389, 108.2240, 
N'https://maps.google.com/maps?q=16.0389,108.2240&z=15&output=embed'),

(10, N'Đèo Hải Vân', 30.00, 
N'Một trong những cung đường ven biển đẹp nhất Việt Nam.', 
N'Đèo Hải Vân, Đà Nẵng - Thừa Thiên Huế', 
16.1990, 108.1320, 
N'https://maps.google.com/maps?q=16.1990,108.1320&z=15&output=embed');

SET IDENTITY_INSERT [dbo].[Attractions] OFF;
GO
-- Vouchers
SET IDENTITY_INSERT [dbo].[Vouchers] ON;
INSERT INTO [dbo].[Vouchers] ([id], [code], [discount_type], [discount_value], [min_booking_value], [valid_from], [valid_to], [usage_limit]) VALUES
(1, N'TET2026', N'PERCENT', 15, 2000000, '2026-01-15', '2026-02-10', 100),
(2, N'NEWYEAR2026', N'FIXED_AMOUNT', 300000, 1500000, '2025-12-25', '2026-01-05', 80),
(3, N'GIOTOHUNG', N'PERCENT', 10, 1000000, '2026-04-05', '2026-04-10', 120),
(4, N'LE304', N'PERCENT', 20, 3000000, '2026-04-25', '2026-05-02', 70),
(5, N'LE29', N'FIXED_AMOUNT', 200000, 1500000, '2026-08-28', '2026-09-03', 90),
(6, N'SUMMER2026', N'PERCENT', 15, 2500000, '2026-05-15', '2026-08-15', 150),
(7, N'FLASHSALE', N'PERCENT', 10, 1000000, '2026-03-01', '2026-03-10', 200),
(8, N'LASTMINUTE', N'FIXED_AMOUNT', 150000, 800000, '2026-01-01', '2026-12-31', 300),
(9, N'WEEKEND', N'PERCENT', 10, 1200000, '2026-01-01', '2026-12-31', 500),
(10, N'LONGSTAY', N'PERCENT', 20, 5000000, '2026-01-01', '2026-12-31', 100),
(11, N'HONEYMOON', N'FIXED_AMOUNT', 500000, 4000000, '2026-01-01', '2026-12-31', 50),
(12, N'CORPORATE', N'PERCENT', 12, 3000000, '2026-01-01', '2026-12-31', 200),
(13, N'NOEL2026', N'PERCENT', 15, 2500000, '2026-12-20', '2026-12-26', 80),
(14, N'YEAR-END', N'FIXED_AMOUNT', 400000, 3000000, '2026-12-27', '2026-12-31', 60),
(15, N'VIP-GUEST', N'PERCENT', 25, 7000000, '2026-01-01', '2026-12-31', 30);
SET IDENTITY_INSERT [dbo].[Vouchers] OFF;
GO
-- BOOKING
SET IDENTITY_INSERT [dbo].[Bookings] ON;
INSERT INTO [dbo].[Bookings] 
([id], [user_id], [guest_name], [guest_phone], [booking_code], [status], [created_by]) 
VALUES 

-- ===== QUÁ KHỨ (ĐÃ HOÀN THÀNH) =====
(1, 13, N'Viên Xuân Quý', N'0901000006', N'BK-0001', N'Completed', 3),
(2, 14, N'Trương Thị Ánh', N'0901000007', N'BK-0002', N'Completed', 3),
(3, 15, N'Nguyễn Thị Hồng Nhung', N'0901000008', N'BK-0003', N'Completed', 3),
(4, 16, N'Nguyễn Thị Phương Thảo', N'0901000009', N'BK-0004', N'Completed', 3),
(5, 17, N'Huỳnh Thị Trúc Ly', N'0901000010', N'BK-0005', N'Completed', 4),

(6, 18, N'Trần Văn Nam', N'0902000001', N'BK-0006', N'Completed', 4),
(7, 19, N'Phan Thị Mai', N'0902000002', N'BK-0007', N'Completed', 4),
(8, 20, N'Lê Hoàng Long', N'0902000003', N'BK-0008', N'Completed', 2),
(9, 21, N'Nguyễn Minh Anh', N'0902000004', N'BK-0009', N'Completed', 2),
(10, 22, N'Đỗ Quỳnh Chi', N'0902000005', N'BK-0010', N'Completed', 2),

-- ===== TƯƠNG LAI (THÁNG 6-7) =====
(11, 13, N'Viên Xuân Quý', N'0901000006', N'BK-0011', N'Confirmed', 3),
(12, 14, N'Trương Thị Ánh', N'0901000007', N'BK-0012', N'Pending', 3),
(13, 15, N'Nguyễn Thị Hồng Nhung', N'0901000008', N'BK-0013', N'Confirmed', 3),
(14, 16, N'Nguyễn Thị Phương Thảo', N'0901000009', N'BK-0014', N'Pending', 4),
(15, 17, N'Huỳnh Thị Trúc Ly', N'0901000010', N'BK-0015', N'Confirmed', 4),
(16, 18, N'Trần Văn Nam', N'0902000001', N'BK-0016', N'Pending', 2),
(17, 19, N'Phan Thị Mai', N'0902000002', N'BK-0017', N'Confirmed', 2),
(18, 20, N'Lê Hoàng Long', N'0902000003', N'BK-0018', N'Pending', 2);

SET IDENTITY_INSERT [dbo].[Bookings] OFF;
GO
SET IDENTITY_INSERT [dbo].[Booking_Details] ON;
INSERT INTO [dbo].[Booking_Details] ([id], [booking_id], [room_id], [room_type_id], [check_in_date], [check_out_date], [applied_price], [price_type]) VALUES 
-- ===== QUÁ KHỨ =====
(1,1,1,1,'2026-02-01','2026-02-03',400000,'NIGHTLY'),
(2,2,6,2,'2026-02-05','2026-02-07',500000,'NIGHTLY'),
(3,3,11,3,'2026-02-10','2026-02-12',650000,'NIGHTLY'),
(4,4,16,4,'2026-02-15','2026-02-18',850000,'NIGHTLY'),
(5,5,21,5,'2026-02-20','2026-02-22',1000000,'NIGHTLY'),

(6,6,26,6,'2026-03-01','2026-03-03',1400000,'NIGHTLY'),
(7,7,31,7,'2026-03-05','2026-03-07',1700000,'NIGHTLY'),
(8,8,36,8,'2026-03-10','2026-03-12',5000000,'NIGHTLY'),
(9,9,2,1,'2026-03-15','2026-03-17',400000,'NIGHTLY'),
(10,10,7,2,'2026-03-20','2026-03-22',500000,'NIGHTLY'),

-- ===== TƯƠNG LAI =====
(11,11,3,1,'2026-06-01','2026-06-03',400000,'NIGHTLY'),
(12,12,8,2,'2026-06-05','2026-06-07',500000,'NIGHTLY'),
(13,13,13,3,'2026-06-10','2026-06-12',650000,'NIGHTLY'),
(14,14,18,4,'2026-06-15','2026-06-18',850000,'NIGHTLY'),
(15,15,23,5,'2026-06-20','2026-06-22',1000000,'NIGHTLY'),
(16,16,28,6,'2026-07-01','2026-07-03',1400000,'NIGHTLY'),
(17,17,33,7,'2026-07-05','2026-07-07',1700000,'NIGHTLY'),
(18,18,37,8,'2026-07-10','2026-07-12',5000000,'NIGHTLY');

SET IDENTITY_INSERT [dbo].[Booking_Details] OFF;
GO
-- Reviews
SET IDENTITY_INSERT [dbo].[Reviews] ON;
INSERT INTO [dbo].[Reviews] ([id], [user_id], [booking_id], [room_type_id], [rating], [comment], [is_visible]) VALUES
-- Review từ những Booking đã Completed (1-10) tương ứng với User (13-22)
(1, 13, 1, 1, 5, N'Phòng sạch sẽ, rất đáng tiền!', 1),          
(2, 14, 2, 2, 5, N'Trải nghiệm tuyệt vời nhất.', 1),            
(3, 15, 3, 3, 3, N'Phòng Superior bình thường, rèm cửa hơi sáng.', 1),          
(4, 16, 4, 4, 5, N'View thành phố về đêm nhìn từ ban công rất đẹp.', 1), 
(5, 17, 5, 5, 4, N'View biển nhìn thẳng ra đón bình minh, giường nằm êm.', 1),    
(6, 18, 6, 6, 5, N'Phòng Family cực kỳ rộng rãi, rất thích hợp cho gia đình đông người.', 0),    
(7, 19, 7, 7, 4, N'Suite sang trọng, nội thất đẹp nhưng phục vụ phòng hơi lâu.', 0),      
(8, 20, 8, 8, 2, N'Chưa hài lòng với tốc độ dọn phòng lúc check-in dù phòng tổng thống cực kỳ xịn xò.', 0), 
(9, 21, 9, 1, 5, N'Nhân viên thân thiện nhiệt tình.', 0),            
(10, 22, 10, 2, 5, N'Tiện nghi đầy đủ, hoàn hảo mọi mặt. Chắc chắn sẽ quay lại.', 0);
SET IDENTITY_INSERT [dbo].[Reviews] OFF;
GO
-- Dịch vụ
SET IDENTITY_INSERT [dbo].[Service_Categories] ON;

INSERT INTO [dbo].[Service_Categories] ([id], [name]) VALUES
(1, N'Ẩm Thực & Nhà Hàng'),
(2, N'Spa & Chăm Sóc Sức Khỏe'),
(3, N'Di Chuyển & Thuê Xe'),
(4, N'Giặt Ủi'),
(5, N'Tour & Trải Nghiệm'),
(6, N'Thể Thao & Giải Trí'),
(7, N'Hồ Bơi & Biển'),
(8, N'Sự Kiện & Hội Nghị'),
(9, N'Dịch Vụ Gia Đình'),
(10, N'Cửa Hàng & Lưu Niệm');
SET IDENTITY_INSERT [dbo].[Service_Categories] OFF;
GO
SET IDENTITY_INSERT [dbo].[Services] ON;

INSERT INTO [dbo].[Services]
([id], [category_id], [name], [price], [unit])
VALUES

-- ===== ẨM THỰC =====
(1,1,N'Buffet sáng',200000,N'Người'),
(2,1,N'Hải sản nướng BBQ',350000,N'Người'),
(3,1,N'Combo ăn tối 2 người',500000,N'Phần'),

-- ===== SPA =====
(4,2,N'Massage toàn thân 60 phút',500000,N'Lượt'),
(5,2,N'Chăm sóc da mặt',400000,N'Lượt'),

-- ===== DI CHUYỂN =====
(6,3,N'Đưa đón sân bay 4 chỗ',350000,N'Chuyến'),
(7,3,N'Thuê xe máy 24h',150000,N'Chiếc'),
(8,3,N'Thuê xe ô tô 7 chỗ',900000,N'Ngày'),

-- ===== GIẶT ỦI =====
(9,4,N'Giặt ủi quần áo',40000,N'Kg'),
(10,4,N'Giặt khô vest',120000,N'Cái'),

-- ===== TOUR =====
(11,5,N'Tour Bà Nà Hills',1200000,N'Người'),
(12,5,N'Tour Hội An 1 ngày',800000,N'Người'),

-- ===== GIẢI TRÍ =====
(13,6,N'Phòng Gym',0,N'Lượt'),
(14,6,N'Lớp Yoga sáng',100000,N'Người'),

-- ===== BIỂN & HỒ BƠI =====
(15,7,N'Ghế nằm bãi biển',100000,N'Lượt'),
(16,7,N'Khăn hồ bơi',0,N'Cái'),

-- ===== SỰ KIỆN =====
(17,8,N'Trang trí phòng họp',2000000,N'Gói'),
(18,8,N'Trang trí hội trường',5000000,N'Gói'),
(19,8,N'Âm thanh ánh sáng sự kiện',3000000,N'Gói'),
(20,8,N'Teabreak (trà + bánh)',100000,N'Người'),

-- ===== GIA ĐÌNH =====
(21,9,N'Dịch vụ giữ trẻ',100000,N'Giờ'),

-- ===== LƯU NIỆM =====
(22,10,N'Móc khóa',50000,N'Cái'),
(23,10,N'Áo thun du lịch Đà Nẵng',150000,N'Cái');

SET IDENTITY_INSERT [dbo].[Services] OFF;
GO
SET IDENTITY_INSERT [dbo].[Order_Services] ON;
INSERT INTO [dbo].[Order_Services] ([id], [booking_detail_id], [total_amount], [status]) VALUES
-- QUÁ KHỨ (Đã sử dụng)
(1, 1, 400000, N'Delivered'),   
(2, 2, 700000, N'Delivered'),   
(3, 4, 350000, N'Delivered'),   
(4, 6, 2400000, N'Delivered'),  
(5, 7, 1000000, N'Delivered'),  
(6, 8, 2000000, N'Delivered'),  
(7, 10, 500000, N'Delivered'),

-- TƯƠNG LAI (Đặt trước online)
(8, 11, 200000, N'Confirmed'),  -- Booking 11 đặt Buffet sáng
(9, 13, 350000, N'Confirmed'),  -- Booking 13 đặt xe Đưa đón
(10, 15, 2400000, N'Confirmed'),-- Booking 15 đặt 2 vé Tour Bà Nà
(11, 17, 1000000, N'Confirmed');-- Booking 17 đặt 2 lượt Massage
SET IDENTITY_INSERT [dbo].[Order_Services] OFF;
GO
SET IDENTITY_INSERT [dbo].[Order_Service_Details] ON;
INSERT INTO [dbo].[Order_Service_Details] ([id], [order_service_id], [service_id], [quantity], [unit_price]) VALUES
-- Chi tiết dịch vụ quá khứ
(1, 1, 1, 2, 200000), (2, 2, 2, 2, 350000), (3, 3, 6, 1, 350000),
(4, 4, 11, 2, 1200000), (5, 5, 4, 2, 500000), (6, 6, 17, 1, 2000000), (7, 7, 3, 1, 500000),
-- Chi tiết dịch vụ đặt trước tương lai
(8, 8, 1, 1, 200000),   -- 1 vé Buffet sáng
(9, 9, 6, 1, 350000),   -- 1 xe đưa đón sân bay
(10, 10, 11, 2, 1200000),-- 2 vé Tour Bà Nà
(11, 11, 4, 2, 500000);  -- 2 lượt Massage
SET IDENTITY_INSERT [dbo].[Order_Service_Details] OFF;
GO
-- Thanh toán
SET IDENTITY_INSERT [dbo].[Invoices] ON;
INSERT INTO [dbo].[Invoices] 
([id], [booking_id], [total_room_amount], [total_service_amount], [discount_amount], [tax_amount], [final_total], [status], [created_by]) VALUES 

-- QUÁ KHỨ (Đã Paid 100%)
(1, 1, 800000, 400000, 0, 120000, 1470000, N'Paid', 3),
(2, 2, 1000000, 700000, 0, 170000, 2220000, N'Paid', 3),
(3, 3, 1300000, 0, 0, 130000, 1430000, N'Paid', 3),
(4, 4, 2550000, 350000, 0, 290000, 3190000, N'Paid', 3),
(5, 5, 2000000, 0, 0, 200000, 2350000, N'Paid', 4),
(6, 6, 2800000, 2400000, 0, 520000, 6020000, N'Paid', 4),
(7, 7, 3400000, 1000000, 0, 440000, 4840000, N'Paid', 4),
(8, 8, 10000000, 2000000, 0, 1200000, 13200000, N'Paid', 2),
(9, 9, 800000, 0, 0, 80000, 880000, N'Paid', 2),
(10, 10, 1000000, 500000, 0, 150000, 1650000, N'Paid', 2),

-- TƯƠNG LAI (Hóa đơn đã bao gồm tiền phòng + dịch vụ đặt trước)
(11, 11, 800000, 200000, 0, 100000, 1100000, N'Unpaid', 3), -- Tổng: 1.1M
(12, 12, 1000000, 0, 0, 100000, 1100000, N'Pending', 3),
(13, 13, 1300000, 350000, 0, 165000, 1815000, N'Unpaid', 3), -- Tổng: 1.815M
(14, 14, 2550000, 0, 0, 255000, 2805000, N'Pending', 4),
(15, 15, 2000000, 2400000, 0, 440000, 4840000, N'Unpaid', 4), -- Tổng: 4.84M
(16, 16, 2800000, 0, 0, 280000, 3080000, N'Pending', 2),
(17, 17, 3400000, 1000000, 0, 440000, 4840000, N'Unpaid', 2), -- Tổng: 4.84M
(18, 18, 10000000, 0, 0, 1000000, 11000000, N'Pending', 2);
SET IDENTITY_INSERT [dbo].[Invoices] OFF;
GO
-- Đền bù thiệt hại 
SET IDENTITY_INSERT [dbo].[Loss_And_Damages] ON;
INSERT INTO [dbo].[Loss_And_Damages] 
([id], [booking_detail_id], [room_inventory_id], [invoice_id], [reported_by], [quantity], [penalty_amount], [description], [status]) VALUES
(1, 1, 10, 1, 8, 1, 150000, N'Làm bẩn khăn tắm không giặt được', 'Paid'),   -- Map với Hóa đơn 1, Phòng 101
(2, 2, 18, 2, 8, 1, 350000, N'Làm hỏng ấm siêu tốc', 'Paid'),               -- Map với Hóa đơn 2, Phòng 201
(3, 5, 69, 5, 8, 1, 150000, N'Mất khăn tắm', 'Paid'),                       -- Map với Hóa đơn 5, Phòng 501
(4, 6, 84, 6, 8, 2, 300000, N'Rách 2 khăn tắm do dính hóa chất', 'Paid');   -- Map với Hóa đơn 6, Phòng 601
SET IDENTITY_INSERT [dbo].[Loss_And_Damages] OFF;
GO
SET IDENTITY_INSERT [dbo].[Payments] ON;
INSERT INTO [dbo].[Payments] 
([id], [invoice_id], [payment_method], [amount_paid], [transaction_code]) 
VALUES 
-- Thanh toán đầy đủ cho quá khứ
(1, 1, N'Cash', 1470000, N'CASH001'), (2, 2, N'VNPay', 2220000, N'VNP002'),
(3, 3, N'Bank', 1430000, N'BANK003'), (4, 4, N'Momo', 3190000, N'MOMO004'),
(5, 5, N'Cash', 2350000, N'CASH005'), (6, 6, N'VNPay', 6020000, N'VNP006'),
(7, 7, N'Bank', 4840000, N'BANK007'), (8, 8, N'Credit Card', 13200000, N'CC008'),
(9, 9, N'Cash', 880000, N'CASH009'), (10, 10, N'Momo', 1650000, N'MOMO010'),

-- Thanh toán tiền cọc (Deposit) cho các đơn tương lai có đặt dịch vụ
(11, 11, N'VNPay', 300000, N'DEP011'),
(12, 13, N'VNPay', 500000, N'DEP013'),
(13, 15, N'Momo', 1000000, N'DEP015'),
(14, 17, N'Bank', 1000000, N'DEP017');
SET IDENTITY_INSERT [dbo].[Payments] OFF;
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
-- Chạy Dynamic SQL để tự động thêm updated_at, created_by... 
-- ==========================================
DECLARE @TableName NVARCHAR(128);
DECLARE @Sql NVARCHAR(MAX);

-- 🔥 ĐÃ THÊM ĐIỀU KIỆN LỌC BỎ BẢNG LOG VÀ BẢNG TRUNG GIAN
DECLARE table_cursor CURSOR FOR
SELECT table_name FROM information_schema.tables 
WHERE table_type = 'BASE TABLE' 
  AND table_name NOT IN ('sysdiagrams', 'Audit_Logs', 'Role_Permissions', 'RoomType_Amenities');

OPEN table_cursor; FETCH NEXT FROM table_cursor INTO @TableName;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @Sql = '';
    
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
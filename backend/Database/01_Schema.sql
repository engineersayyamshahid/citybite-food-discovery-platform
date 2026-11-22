-- CityBite database schema (SQL Server)
-- Food discovery & rating app: restaurants generate bills, customers rate dishes with the bill review code.
-- Run in SSMS on an empty database, then use Database Diagrams > New Database Diagram > add all tables.

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

CREATE TABLE [dbo].[Areas] (
    [AreaId] int IDENTITY(1,1) NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [City] nvarchar(100) NOT NULL,
    CONSTRAINT [PK_Areas] PRIMARY KEY CLUSTERED ([AreaId])
);
GO

CREATE TABLE [dbo].[Users] (
    [UserId] int IDENTITY(1,1) NOT NULL,
    [Role] varchar(20) NOT NULL,
    [FullName] nvarchar(120) NOT NULL,
    [Email] nvarchar(255) NULL,
    [Mobile] varchar(20) NULL,
    [PasswordHash] varchar(255) NOT NULL,
    [IsVerified] bit NOT NULL CONSTRAINT [DF_Users_IsVerified] DEFAULT (0),
    [AreaId] int NULL,
    [CreatedAt] datetime2 NOT NULL CONSTRAINT [DF_Users_CreatedAt] DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED ([UserId]),
    CONSTRAINT [CK_Users_1] CHECK (Role IN ('customer','restaurant_owner')),
    CONSTRAINT [CK_Users_2] CHECK (Email IS NOT NULL OR Mobile IS NOT NULL)
);
GO

CREATE TABLE [dbo].[OtpVerifications] (
    [OtpId] int IDENTITY(1,1) NOT NULL,
    [UserId] int NOT NULL,
    [CodeHash] varchar(255) NOT NULL,
    [Purpose] varchar(10) NOT NULL,
    [ExpiresAt] datetime2 NOT NULL,
    [VerifiedAt] datetime2 NULL,
    CONSTRAINT [PK_OtpVerifications] PRIMARY KEY CLUSTERED ([OtpId]),
    CONSTRAINT [CK_OtpVerifications_1] CHECK (Purpose IN ('signup','reset'))
);
GO

CREATE TABLE [dbo].[Restaurants] (
    [RestaurantId] int IDENTITY(1,1) NOT NULL,
    [OwnerId] int NOT NULL,
    [AreaId] int NOT NULL,
    [Name] nvarchar(120) NOT NULL,
    [Description] nvarchar(500) NULL,
    [Address] nvarchar(255) NOT NULL,
    [LogoUrl] varchar(500) NULL,
    [CoverPhotoUrl] varchar(500) NULL,
    [DineIn] bit NOT NULL CONSTRAINT [DF_Restaurants_DineIn] DEFAULT (1),
    [AvgRating] decimal(3,2) NOT NULL CONSTRAINT [DF_Restaurants_AvgRating] DEFAULT (0),
    [ReviewCount] int NOT NULL CONSTRAINT [DF_Restaurants_ReviewCount] DEFAULT (0),
    CONSTRAINT [PK_Restaurants] PRIMARY KEY CLUSTERED ([RestaurantId]),
    CONSTRAINT [UQ_Restaurants_OwnerId] UNIQUE ([OwnerId])
);
GO

CREATE TABLE [dbo].[Cuisines] (
    [CuisineId] int IDENTITY(1,1) NOT NULL,
    [Name] nvarchar(60) NOT NULL,
    [Icon] varchar(255) NULL,
    CONSTRAINT [PK_Cuisines] PRIMARY KEY CLUSTERED ([CuisineId]),
    CONSTRAINT [UQ_Cuisines_Name] UNIQUE ([Name])
);
GO

CREATE TABLE [dbo].[RestaurantCuisines] (
    [RestaurantId] int NOT NULL,
    [CuisineId] int NOT NULL,
    CONSTRAINT [PK_RestaurantCuisines] PRIMARY KEY CLUSTERED ([RestaurantId], [CuisineId])
);
GO

CREATE TABLE [dbo].[OpeningHours] (
    [HoursId] int IDENTITY(1,1) NOT NULL,
    [RestaurantId] int NOT NULL,
    [DayOfWeek] tinyint NOT NULL,
    [OpenTime] time(0) NULL,
    [CloseTime] time(0) NULL,
    [IsClosed] bit NOT NULL CONSTRAINT [DF_OpeningHours_IsClosed] DEFAULT (0),
    CONSTRAINT [PK_OpeningHours] PRIMARY KEY CLUSTERED ([HoursId]),
    CONSTRAINT [UQ_OpeningHours_RestaurantId_DayOfWeek] UNIQUE ([RestaurantId], [DayOfWeek]),
    CONSTRAINT [CK_OpeningHours_1] CHECK (DayOfWeek BETWEEN 1 AND 7)
);
GO

CREATE TABLE [dbo].[Categories] (
    [CategoryId] int IDENTITY(1,1) NOT NULL,
    [RestaurantId] int NOT NULL,
    [Name] nvarchar(60) NOT NULL,
    [SortOrder] int NOT NULL CONSTRAINT [DF_Categories_SortOrder] DEFAULT (0),
    CONSTRAINT [PK_Categories] PRIMARY KEY CLUSTERED ([CategoryId])
);
GO

CREATE TABLE [dbo].[FoodTypes] (
    [FoodTypeId] int IDENTITY(1,1) NOT NULL,
    [CuisineId] int NOT NULL,
    [Name] nvarchar(80) NOT NULL,
    CONSTRAINT [PK_FoodTypes] PRIMARY KEY CLUSTERED ([FoodTypeId])
);
GO

CREATE TABLE [dbo].[Dishes] (
    [DishId] int IDENTITY(1,1) NOT NULL,
    [RestaurantId] int NOT NULL,
    [CategoryId] int NULL,
    [FoodTypeId] int NULL,
    [Name] nvarchar(120) NOT NULL,
    [Description] nvarchar(500) NULL,
    [BasePrice] decimal(10,2) NOT NULL,
    [PhotoUrl] varchar(500) NULL,
    [IsAvailable] bit NOT NULL CONSTRAINT [DF_Dishes_IsAvailable] DEFAULT (1),
    [AvgRating] decimal(3,2) NOT NULL CONSTRAINT [DF_Dishes_AvgRating] DEFAULT (0),
    [ReviewCount] int NOT NULL CONSTRAINT [DF_Dishes_ReviewCount] DEFAULT (0),
    CONSTRAINT [PK_Dishes] PRIMARY KEY CLUSTERED ([DishId])
);
GO

CREATE TABLE [dbo].[DishSizes] (
    [SizeId] int IDENTITY(1,1) NOT NULL,
    [DishId] int NOT NULL,
    [Label] nvarchar(40) NOT NULL,
    [Price] decimal(10,2) NOT NULL,
    CONSTRAINT [PK_DishSizes] PRIMARY KEY CLUSTERED ([SizeId])
);
GO

CREATE TABLE [dbo].[Bills] (
    [BillId] int IDENTITY(1,1) NOT NULL,
    [RestaurantId] int NOT NULL,
    [BillNo] int NOT NULL,
    [TableNo] int NULL,
    [Total] decimal(12,2) NOT NULL,
    [ReviewCode] char(6) NOT NULL,
    [CreatedAt] datetime2 NOT NULL CONSTRAINT [DF_Bills_CreatedAt] DEFAULT (SYSUTCDATETIME()),
    [CodeExpiresAt] datetime2 NOT NULL,
    [MaxReviewers] tinyint NOT NULL CONSTRAINT [DF_Bills_MaxReviewers] DEFAULT (4),
    [UsedCount] tinyint NOT NULL CONSTRAINT [DF_Bills_UsedCount] DEFAULT (0),
    CONSTRAINT [PK_Bills] PRIMARY KEY CLUSTERED ([BillId]),
    CONSTRAINT [UQ_Bills_ReviewCode] UNIQUE ([ReviewCode]),
    CONSTRAINT [UQ_Bills_RestaurantId_BillNo] UNIQUE ([RestaurantId], [BillNo]),
    CONSTRAINT [CK_Bills_1] CHECK (UsedCount <= MaxReviewers)
);
GO

CREATE TABLE [dbo].[BillItems] (
    [BillItemId] int IDENTITY(1,1) NOT NULL,
    [BillId] int NOT NULL,
    [DishId] int NOT NULL,
    [SizeId] int NULL,
    [Qty] int NOT NULL,
    [UnitPrice] decimal(10,2) NOT NULL,
    [LineTotal] decimal(12,2) NOT NULL,
    CONSTRAINT [PK_BillItems] PRIMARY KEY CLUSTERED ([BillItemId]),
    CONSTRAINT [CK_BillItems_1] CHECK (Qty > 0)
);
GO

CREATE TABLE [dbo].[CodeUses] (
    [BillId] int NOT NULL,
    [UserId] int NOT NULL,
    [RedeemedAt] datetime2 NOT NULL CONSTRAINT [DF_CodeUses_RedeemedAt] DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_CodeUses] PRIMARY KEY CLUSTERED ([BillId], [UserId])
);
GO

CREATE TABLE [dbo].[Reviews] (
    [ReviewId] int IDENTITY(1,1) NOT NULL,
    [UserId] int NOT NULL,
    [BillItemId] int NOT NULL,
    [DishId] int NOT NULL,
    [Rating] tinyint NOT NULL,
    [Comment] nvarchar(1000) NULL,
    [CreatedAt] datetime2 NOT NULL CONSTRAINT [DF_Reviews_CreatedAt] DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_Reviews] PRIMARY KEY CLUSTERED ([ReviewId]),
    CONSTRAINT [UQ_Reviews_UserId_BillItemId] UNIQUE ([UserId], [BillItemId]),
    CONSTRAINT [CK_Reviews_1] CHECK (Rating BETWEEN 1 AND 5)
);
GO

CREATE TABLE [dbo].[ReviewPhotos] (
    [PhotoId] int IDENTITY(1,1) NOT NULL,
    [ReviewId] int NOT NULL,
    [PhotoUrl] varchar(500) NOT NULL,
    CONSTRAINT [PK_ReviewPhotos] PRIMARY KEY CLUSTERED ([PhotoId])
);
GO

CREATE TABLE [dbo].[PromotionPackages] (
    [PackageId] int IDENTITY(1,1) NOT NULL,
    [Name] nvarchar(60) NOT NULL,
    [Placement] varchar(10) NOT NULL,
    [Price] decimal(10,2) NOT NULL,
    CONSTRAINT [PK_PromotionPackages] PRIMARY KEY CLUSTERED ([PackageId]),
    CONSTRAINT [CK_PromotionPackages_1] CHECK (Placement IN ('home','search'))
);
GO

CREATE TABLE [dbo].[Promotions] (
    [PromotionId] int IDENTITY(1,1) NOT NULL,
    [RestaurantId] int NOT NULL,
    [PackageId] int NOT NULL,
    [DurationDays] tinyint NOT NULL,
    [StartDate] date NOT NULL,
    [EndDate] date NOT NULL,
    [AmountPaid] decimal(10,2) NOT NULL,
    [Status] varchar(10) NOT NULL CONSTRAINT [DF_Promotions_Status] DEFAULT ('active'),
    [Views] int NOT NULL CONSTRAINT [DF_Promotions_Views] DEFAULT (0),
    [Taps] int NOT NULL CONSTRAINT [DF_Promotions_Taps] DEFAULT (0),
    [Saves] int NOT NULL CONSTRAINT [DF_Promotions_Saves] DEFAULT (0),
    CONSTRAINT [PK_Promotions] PRIMARY KEY CLUSTERED ([PromotionId]),
    CONSTRAINT [CK_Promotions_1] CHECK (DurationDays IN (7,14,30)),
    CONSTRAINT [CK_Promotions_2] CHECK (Status IN ('active','ended'))
);
GO

CREATE TABLE [dbo].[FavoriteDishes] (
    [UserId] int NOT NULL,
    [DishId] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL CONSTRAINT [DF_FavoriteDishes_CreatedAt] DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_FavoriteDishes] PRIMARY KEY CLUSTERED ([UserId], [DishId])
);
GO

CREATE TABLE [dbo].[FavoriteRestaurants] (
    [UserId] int NOT NULL,
    [RestaurantId] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL CONSTRAINT [DF_FavoriteRestaurants_CreatedAt] DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_FavoriteRestaurants] PRIMARY KEY CLUSTERED ([UserId], [RestaurantId])
);
GO

CREATE TABLE [dbo].[UserFavoriteTypes] (
    [UserId] int NOT NULL,
    [FoodTypeId] int NOT NULL,
    CONSTRAINT [PK_UserFavoriteTypes] PRIMARY KEY CLUSTERED ([UserId], [FoodTypeId])
);
GO

-- Email and mobile are each unique when present
CREATE UNIQUE INDEX [UX_Users_Email] ON [dbo].[Users]([Email]) WHERE [Email] IS NOT NULL;
CREATE UNIQUE INDEX [UX_Users_Mobile] ON [dbo].[Users]([Mobile]) WHERE [Mobile] IS NOT NULL;
GO

-- Foreign keys
ALTER TABLE [dbo].[Users] ADD CONSTRAINT [FK_Users_Areas_AreaId] FOREIGN KEY ([AreaId]) REFERENCES [dbo].[Areas] ([AreaId]);
ALTER TABLE [dbo].[OtpVerifications] ADD CONSTRAINT [FK_OtpVerifications_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([UserId]);
ALTER TABLE [dbo].[Restaurants] ADD CONSTRAINT [FK_Restaurants_Users_OwnerId] FOREIGN KEY ([OwnerId]) REFERENCES [dbo].[Users] ([UserId]);
ALTER TABLE [dbo].[Restaurants] ADD CONSTRAINT [FK_Restaurants_Areas_AreaId] FOREIGN KEY ([AreaId]) REFERENCES [dbo].[Areas] ([AreaId]);
ALTER TABLE [dbo].[RestaurantCuisines] ADD CONSTRAINT [FK_RestaurantCuisines_Restaurants_RestaurantId] FOREIGN KEY ([RestaurantId]) REFERENCES [dbo].[Restaurants] ([RestaurantId]);
ALTER TABLE [dbo].[RestaurantCuisines] ADD CONSTRAINT [FK_RestaurantCuisines_Cuisines_CuisineId] FOREIGN KEY ([CuisineId]) REFERENCES [dbo].[Cuisines] ([CuisineId]);
ALTER TABLE [dbo].[OpeningHours] ADD CONSTRAINT [FK_OpeningHours_Restaurants_RestaurantId] FOREIGN KEY ([RestaurantId]) REFERENCES [dbo].[Restaurants] ([RestaurantId]);
ALTER TABLE [dbo].[Categories] ADD CONSTRAINT [FK_Categories_Restaurants_RestaurantId] FOREIGN KEY ([RestaurantId]) REFERENCES [dbo].[Restaurants] ([RestaurantId]);
ALTER TABLE [dbo].[FoodTypes] ADD CONSTRAINT [FK_FoodTypes_Cuisines_CuisineId] FOREIGN KEY ([CuisineId]) REFERENCES [dbo].[Cuisines] ([CuisineId]);
ALTER TABLE [dbo].[Dishes] ADD CONSTRAINT [FK_Dishes_Restaurants_RestaurantId] FOREIGN KEY ([RestaurantId]) REFERENCES [dbo].[Restaurants] ([RestaurantId]);
ALTER TABLE [dbo].[Dishes] ADD CONSTRAINT [FK_Dishes_Categories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [dbo].[Categories] ([CategoryId]);
ALTER TABLE [dbo].[Dishes] ADD CONSTRAINT [FK_Dishes_FoodTypes_FoodTypeId] FOREIGN KEY ([FoodTypeId]) REFERENCES [dbo].[FoodTypes] ([FoodTypeId]);
ALTER TABLE [dbo].[DishSizes] ADD CONSTRAINT [FK_DishSizes_Dishes_DishId] FOREIGN KEY ([DishId]) REFERENCES [dbo].[Dishes] ([DishId]);
ALTER TABLE [dbo].[Bills] ADD CONSTRAINT [FK_Bills_Restaurants_RestaurantId] FOREIGN KEY ([RestaurantId]) REFERENCES [dbo].[Restaurants] ([RestaurantId]);
ALTER TABLE [dbo].[BillItems] ADD CONSTRAINT [FK_BillItems_Bills_BillId] FOREIGN KEY ([BillId]) REFERENCES [dbo].[Bills] ([BillId]);
ALTER TABLE [dbo].[BillItems] ADD CONSTRAINT [FK_BillItems_Dishes_DishId] FOREIGN KEY ([DishId]) REFERENCES [dbo].[Dishes] ([DishId]);
ALTER TABLE [dbo].[BillItems] ADD CONSTRAINT [FK_BillItems_DishSizes_SizeId] FOREIGN KEY ([SizeId]) REFERENCES [dbo].[DishSizes] ([SizeId]);
ALTER TABLE [dbo].[CodeUses] ADD CONSTRAINT [FK_CodeUses_Bills_BillId] FOREIGN KEY ([BillId]) REFERENCES [dbo].[Bills] ([BillId]);
ALTER TABLE [dbo].[CodeUses] ADD CONSTRAINT [FK_CodeUses_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([UserId]);
ALTER TABLE [dbo].[Reviews] ADD CONSTRAINT [FK_Reviews_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([UserId]);
ALTER TABLE [dbo].[Reviews] ADD CONSTRAINT [FK_Reviews_BillItems_BillItemId] FOREIGN KEY ([BillItemId]) REFERENCES [dbo].[BillItems] ([BillItemId]);
ALTER TABLE [dbo].[Reviews] ADD CONSTRAINT [FK_Reviews_Dishes_DishId] FOREIGN KEY ([DishId]) REFERENCES [dbo].[Dishes] ([DishId]);
ALTER TABLE [dbo].[ReviewPhotos] ADD CONSTRAINT [FK_ReviewPhotos_Reviews_ReviewId] FOREIGN KEY ([ReviewId]) REFERENCES [dbo].[Reviews] ([ReviewId]);
ALTER TABLE [dbo].[Promotions] ADD CONSTRAINT [FK_Promotions_Restaurants_RestaurantId] FOREIGN KEY ([RestaurantId]) REFERENCES [dbo].[Restaurants] ([RestaurantId]);
ALTER TABLE [dbo].[Promotions] ADD CONSTRAINT [FK_Promotions_PromotionPackages_PackageId] FOREIGN KEY ([PackageId]) REFERENCES [dbo].[PromotionPackages] ([PackageId]);
ALTER TABLE [dbo].[FavoriteDishes] ADD CONSTRAINT [FK_FavoriteDishes_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([UserId]);
ALTER TABLE [dbo].[FavoriteDishes] ADD CONSTRAINT [FK_FavoriteDishes_Dishes_DishId] FOREIGN KEY ([DishId]) REFERENCES [dbo].[Dishes] ([DishId]);
ALTER TABLE [dbo].[FavoriteRestaurants] ADD CONSTRAINT [FK_FavoriteRestaurants_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([UserId]);
ALTER TABLE [dbo].[FavoriteRestaurants] ADD CONSTRAINT [FK_FavoriteRestaurants_Restaurants_RestaurantId] FOREIGN KEY ([RestaurantId]) REFERENCES [dbo].[Restaurants] ([RestaurantId]);
ALTER TABLE [dbo].[UserFavoriteTypes] ADD CONSTRAINT [FK_UserFavoriteTypes_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([UserId]);
ALTER TABLE [dbo].[UserFavoriteTypes] ADD CONSTRAINT [FK_UserFavoriteTypes_FoodTypes_FoodTypeId] FOREIGN KEY ([FoodTypeId]) REFERENCES [dbo].[FoodTypes] ([FoodTypeId]);
GO

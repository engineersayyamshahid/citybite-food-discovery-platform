-- CityBite: lookup data needed before the apps can be used.
-- Safe to run more than once (only inserts rows that are missing).
-- Run on the CityBite database after 01_Schema.sql.

SET NOCOUNT ON;

-- Areas (screen 11 "Choose your area", restaurant signup)
INSERT INTO dbo.Areas (Name, City)
SELECT v.Name, v.City
FROM (VALUES
    (N'Model Town',        N'Multan'),
    (N'Gulgasht Colony',   N'Multan'),
    (N'Cantt',             N'Multan'),
    (N'Bosan Road',        N'Multan'),
    (N'Shah Rukn-e-Alam',  N'Multan'),
    (N'Mumtazabad',        N'Multan')
) AS v(Name, City)
WHERE NOT EXISTS (SELECT 1 FROM dbo.Areas a WHERE a.Name = v.Name AND a.City = v.City);

-- Cuisines (filters, "Browse by cuisine", restaurant details)
INSERT INTO dbo.Cuisines (Name)
SELECT v.Name
FROM (VALUES (N'Desi'), (N'BBQ'), (N'Fast Food'), (N'Chinese'), (N'Continental'),
             (N'Pizza'), (N'Bakery'), (N'Desserts'), (N'Drinks')) AS v(Name)
WHERE NOT EXISTS (SELECT 1 FROM dbo.Cuisines c WHERE c.Name = v.Name);

-- Food types (screen 10 taste picker: parent food -> types)
INSERT INTO dbo.FoodTypes (CuisineId, Name)
SELECT c.CuisineId, v.Name
FROM (VALUES
    (N'Desi', N'Chicken Karahi'), (N'Desi', N'Beef Karahi'), (N'Desi', N'Mutton Karahi'), (N'Desi', N'Namkeen Karahi'),
    (N'BBQ', N'Seekh Kabab'), (N'BBQ', N'Chicken Tikka'), (N'BBQ', N'Beef Seekh Kabab'), (N'BBQ', N'Reshmi Kabab'),
    (N'Pizza', N'Cheese Pizza'), (N'Pizza', N'Pepperoni Pizza'), (N'Pizza', N'Tikka Pizza'), (N'Pizza', N'Margherita'),
    (N'Desserts', N'Cake'), (N'Desserts', N'Kheer'), (N'Desserts', N'Gulab Jamun'), (N'Desserts', N'Ice Cream'),
    (N'Bakery', N'Garlic Naan'), (N'Bakery', N'Roghni Naan'), (N'Bakery', N'Paratha'), (N'Bakery', N'Roti'),
    (N'Fast Food', N'Beef Burger'), (N'Fast Food', N'Chicken Burger'), (N'Fast Food', N'Zinger Burger'), (N'Fast Food', N'Shawarma'),
    (N'Chinese', N'Chow Mein'), (N'Chinese', N'Fried Rice'), (N'Chinese', N'Manchurian'), (N'Chinese', N'Hot & Sour Soup')
) AS v(Cuisine, Name)
JOIN dbo.Cuisines c ON c.Name = v.Cuisine
WHERE NOT EXISTS (SELECT 1 FROM dbo.FoodTypes f WHERE f.Name = v.Name AND f.CuisineId = c.CuisineId);

-- Promotion packages (screen 37 "Promote my restaurant")
INSERT INTO dbo.PromotionPackages (Name, Placement, Price)
SELECT v.Name, v.Placement, v.Price
FROM (VALUES (N'Featured on Home', 'home', 2000.00), (N'Top of search', 'search', 3500.00)) AS v(Name, Placement, Price)
WHERE NOT EXISTS (SELECT 1 FROM dbo.PromotionPackages p WHERE p.Name = v.Name);

SELECT (SELECT COUNT(*) FROM dbo.Areas) AS Areas,
       (SELECT COUNT(*) FROM dbo.Cuisines) AS Cuisines,
       (SELECT COUNT(*) FROM dbo.FoodTypes) AS FoodTypes,
       (SELECT COUNT(*) FROM dbo.PromotionPackages) AS PromotionPackages;

CREATE TABLE [dbo].[Category]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY (1,1), 
    [UserId] NVARCHAR(150) NOT NULL, 
    [Name] NVARCHAR(200) NOT NULL, 
    [Date] DATETIME NOT NULL, 
    [Allocation] MONEY NOT NULL, 
    [CurrentSpend] MONEY NOT NULL, 
    [Budget] INT NOT NULL,
    CONSTRAINT [FK_Category_Budget] FOREIGN KEY ([Budget]) REFERENCES [Budget]([Id]),
    CONSTRAINT [FK_Category_User] FOREIGN KEY ([UserId]) REFERENCES [User]([UserId]),
)
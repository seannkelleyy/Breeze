CREATE TABLE [dbo].[expense]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY (0,1), 
    [userId] NVARCHAR(50) NOT NULL, 
    [name] NVARCHAR(50) NOT NULL, 
    [date] DATETIME NULL, 
    [categoryId] INT NOT NULL, 
    [cost] MONEY NOT NULL,
    CONSTRAINT [FK_Expenses_Category] FOREIGN KEY ([categoryId]) REFERENCES [category]([Id]),
)

CREATE TABLE [dbo].[Expense]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY (1,1), 
    [UserId] NVARCHAR(50) NOT NULL, 
    [CategoryId] INT NOT NULL, 
    [Name] NVARCHAR(50) NOT NULL, 
    [Amount] DECIMAL(18, 2) NOT NULL,
    [Date] DATE NOT NULL,
    CONSTRAINT [FK_Expense_Category] FOREIGN KEY ([CategoryId]) REFERENCES [Category]([Id]),
)
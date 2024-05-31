CREATE TABLE [dbo].[Expense]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY (1,1), 
    [UserEmail] NVARCHAR(150) NOT NULL, 
    [CategoryId] INT NOT NULL, 
    [Name] NVARCHAR(50) NOT NULL, 
    [Amount] DECIMAL(18, 2) NOT NULL,
    [Year] INT NOT NULL,
    [Month] INT NOT NULL,
    [Day] INT NOT NULL,
    CONSTRAINT [FK_Expense_Category] FOREIGN KEY ([CategoryId]) REFERENCES [Category]([Id]),
)
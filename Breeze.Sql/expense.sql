CREATE TABLE [dbo].[Expense]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY (1,1), 
    [UserEmail] NVARCHAR(150) NOT NULL, 
    [Name] NVARCHAR(50) NOT NULL, 
    [Date] DATETIME NOT NULL, 
    [CategoryId] INT NOT NULL, 
    [Amount] MONEY NOT NULL,
    CONSTRAINT [FK_Expense_Category] FOREIGN KEY ([CategoryId]) REFERENCES [Category]([Id]),
    CONSTRAINT [FK_Expense_User] FOREIGN KEY ([UserEmail]) REFERENCES [User]([UserEmail]),
)
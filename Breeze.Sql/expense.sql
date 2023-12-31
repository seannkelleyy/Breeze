﻿CREATE TABLE [dbo].[Expense]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY (1,1), 
    [UserId] NVARCHAR(50) NOT NULL, 
    [Name] NVARCHAR(50) NOT NULL, 
    [Date] DATETIME NOT NULL, 
    [CategoryId] INT NOT NULL, 
    [Amount] MONEY NOT NULL,
    CONSTRAINT [FK_Expenses_Category] FOREIGN KEY ([CategoryId]) REFERENCES [Category]([Id]),
)
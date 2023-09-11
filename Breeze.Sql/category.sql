CREATE TABLE [dbo].[category]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY (0,1), 
    [userId] NVARCHAR(50) NOT NULL, 
    [name] NVARCHAR(50) NULL, 
    [date] DATETIME NOT NULL, 
    [budget] MONEY NOT NULL, 
    [currentSpend] MONEY NOT NULL,

)

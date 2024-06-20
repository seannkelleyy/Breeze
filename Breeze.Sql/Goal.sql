CREATE TABLE [dbo].[Goal]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY (1,1), 
    [UserId] NVARCHAR(50) NOT NULL, 
    [Description] NVARCHAR(150) NOT NULL, 
    [IsCompleted] BIT NOT NULL, 

)

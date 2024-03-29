﻿namespace Breeze.Domain
{
    public class Expense
    {
        public int Id { get; set; }
        public User User { get; set; }
        public string Name { get; set; }
        public DateTime Date { get; set; }
        public Category Category { get; set; }
        public decimal Amount { get; set; }
    }
}

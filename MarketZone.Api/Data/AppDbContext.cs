using Microsoft.EntityFrameworkCore;


namespace MarketZone.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Cart> Cart => Set<Cart>();
    public DbSet<Order> Orders => Set<Order>();
}

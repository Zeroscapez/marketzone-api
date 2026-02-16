using System.ComponentModel.DataAnnotations;

namespace MarketZone.Api.DTOs;

public class RegisterDto
{
    [Required]
    public string FirstName { get; set; } = "";

    [Required]
    public string LastName { get; set; } = "";

    [Required]
    [EmailAddress]
    public string Email { get; set; } = "";

    [Required]
    public string Username { get; set; } = "";

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = "";

    public string? Street { get; set; }
    public string? ZipCode { get; set; }
    public string? State { get; set; }
}

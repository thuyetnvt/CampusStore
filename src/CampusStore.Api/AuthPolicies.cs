namespace CampusStore.Api;

public static class AuthPolicies
{
    public const string CustomerOnly = "CustomerOnly";
    public const string StaffOrAdmin = "StaffOrAdmin";
    public const string AdminOnly = "AdminOnly";
}

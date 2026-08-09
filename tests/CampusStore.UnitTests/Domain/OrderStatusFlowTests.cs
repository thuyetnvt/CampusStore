using CampusStore.Domain.Enums;
using CampusStore.Domain.Rules;

namespace CampusStore.UnitTests.Domain;

public sealed class OrderStatusFlowTests
{
    [Theory]
    [InlineData(OrderStatus.Pending, OrderStatus.Confirmed)]
    [InlineData(OrderStatus.Pending, OrderStatus.Cancelled)]
    [InlineData(OrderStatus.Confirmed, OrderStatus.Shipping)]
    [InlineData(OrderStatus.Confirmed, OrderStatus.Cancelled)]
    [InlineData(OrderStatus.Shipping, OrderStatus.Completed)]
    [InlineData((OrderStatus)3, OrderStatus.Completed)]
    public void CanTransition_ReturnsTrue_ForAllowedTransitions(OrderStatus current, OrderStatus next)
    {
        Assert.True(OrderStatusFlow.CanTransition(current, next));
    }

    [Theory]
    [InlineData(OrderStatus.Completed, OrderStatus.Pending)]
    [InlineData(OrderStatus.Cancelled, OrderStatus.Confirmed)]
    [InlineData(OrderStatus.Shipping, OrderStatus.Pending)]
    [InlineData(OrderStatus.Pending, OrderStatus.Completed)]
    [InlineData(OrderStatus.Pending, OrderStatus.Shipping)]
    [InlineData(OrderStatus.Confirmed, OrderStatus.Pending)]
    public void CanTransition_ReturnsFalse_ForInvalidTransitions(OrderStatus current, OrderStatus next)
    {
        Assert.False(OrderStatusFlow.CanTransition(current, next));
    }
}

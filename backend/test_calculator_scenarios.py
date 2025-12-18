from app.services.investment_calculator import calculate_compound_interest
import logging

# Configure minimal logging
logging.basicConfig(level=logging.ERROR)

def verify_scenarios():
    print("--- Verifying Calculation Scenarios ---")
    
    scenarios = [
        # (Monthly, Years, Return, Expected Approximate FV)
        (1000, 10, 7.0, 173084),
        (500, 5, 5.0, 33969),
        (2000, 20, 8.0, 1179577),
    ]
    
    all_passed = True
    
    for i, (monthly, years, rate, expected) in enumerate(scenarios, 1):
        result = calculate_compound_interest(monthly, years, rate)
        fv = result['future_value']
        total_contributed = result['total_contributed']
        total_earnings = result['total_earnings']
        
        # Check integrity
        integrity_check = abs((total_contributed + total_earnings) - fv) < 0.01
        
        # Check accuracy (within 1% tolerance due to formula variations)
        accuracy_check = abs(fv - expected) / expected < 0.01
        
        print(f"\nTest {i}: {monthly}/mo, {years} yrs, {rate}%")
        print(f"  > Computed FV: {fv:,.2f}")
        print(f"  > Expected FV: {expected:,.2f}")
        print(f"  > Integrity (FV = Contrib + Earn): {'✅' if integrity_check else '❌'}")
        
        if accuracy_check:
            print(f"  > Accuracy: ✅ Passed")
        else:
            print(f"  > Accuracy: ❌ Failed (Diff: {fv - expected:,.2f})")
            all_passed = False

    if all_passed:
        print("\n✅ All calculation scenarios passed.")
    else:
        print("\n❌ Some scenarios failed.")

if __name__ == "__main__":
    verify_scenarios()

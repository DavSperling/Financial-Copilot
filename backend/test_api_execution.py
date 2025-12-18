import urllib.request
import json
import sys

BASE_URL = "http://localhost:8000/api/v1/recommendations"

def test_profile(profile_id, expected_stocks, expected_bonds, expected_cash):
    try:
        url = f"{BASE_URL}?profile={profile_id}"
        with urllib.request.urlopen(url) as response:
            if response.status != 200:
                print(f"[FAIL] Profile {profile_id}: HTTP {response.status}")
                return False
            
            data = json.loads(response.read().decode())
            
            stocks = data.get("stocks")
            bonds = data.get("bonds")
            cash = data.get("cash")
            
            # Verify percentages
            if stocks != expected_stocks or bonds != expected_bonds or cash != expected_cash:
                print(f"[FAIL] Profile {profile_id}: Expected {expected_stocks}/{expected_bonds}/{expected_cash}, got {stocks}/{bonds}/{cash}")
                return False
            
            # Verify sum
            total = stocks + bonds + cash
            if total != 100:
                print(f"[FAIL] Profile {profile_id}: Sum is {total}%, expected 100%")
                return False
                
            print(f"[PASS] Profile {profile_id} - {data.get('profile_type')}")
            return True
            
    except Exception as e:
        print(f"[FAIL] Profile {profile_id}: Exception {e}")
        return False

def test_invalid_profile(profile_id):
    try:
        url = f"{BASE_URL}?profile={profile_id}"
        urllib.request.urlopen(url)
        print(f"[FAIL] Invalid Profile {profile_id}: Should have failed but returned 200 OK")
        return False
    except urllib.error.HTTPError as e:
        if e.code == 400:
            print(f"[PASS] Invalid Profile {profile_id}: Refused with 400 Bad Request")
            return True
        else:
            print(f"[FAIL] Invalid Profile {profile_id}: Failed with {e.code} (Expected 400)")
            return False
    except Exception as e:
        print(f"[FAIL] Invalid Profile {profile_id}: Exception {e}")
        return False

print("Starting Backend API Tests...")
success = True

success &= test_profile(1, 20, 60, 20)
success &= test_profile(2, 50, 35, 15)
success &= test_profile(3, 70, 20, 10)
success &= test_profile(4, 90, 5, 5)

success &= test_invalid_profile(0)
success &= test_invalid_profile(5)

if success:
    print("\nAll Backend Tests PASSED")
else:
    print("\nSome Backend Tests FAILED")

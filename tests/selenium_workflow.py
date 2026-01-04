import time
import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from selenium.webdriver.common.action_chains import ActionChains

# --- CONFIGURATION ---
import os
import time
BASE_URL = os.getenv("TEST_BASE_URL", "http://localhost:5173") 
TEST_RUN_ID = int(time.time())

USER_EMAIL = f"test{TEST_RUN_ID}@example.com"
USER_NAME = f"Test User {TEST_RUN_ID}"
USER_PASSWORD = "Password123!"

class FinancialCopilotTests(unittest.TestCase):
    def setUp(self):
        options = webdriver.ChromeOptions()
        if os.getenv("CI"):
            options.add_argument('--headless')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            
        options.add_argument('--disable-blink-features=AutomationControlled') 
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        self.driver = webdriver.Chrome(options=options)
        self.driver.maximize_window()
        self.driver.set_window_size(1920, 1080)
        self.wait = WebDriverWait(self.driver, 20)

    def tearDown(self):
        if self.driver:
            self.driver.quit()

    def set_react_input_value(self, element, value):
        """
        Méthode robuste pour définir la valeur d'un input React contrôlé.
        Utilise le prototype natif pour contourner le getter/setter de React.
        """
        self.driver.execute_script("""
            const element = arguments[0];
            const value = arguments[1];
            
            // Obtenir le setter natif du prototype HTMLInputElement
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype, 'value'
            ).set;
            
            // Utiliser le setter natif pour définir la valeur
            nativeInputValueSetter.call(element, value);
            
            // Déclencher les événements que React écoute
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
        """, element, str(value))

    def test_01_signup_and_onboarding(self):
        """Test complet: Inscription + Onboarding (9 étapes)"""
        print(f"\n--- TEST 1: SIGNUP & ONBOARDING (User: {USER_EMAIL}) ---")
        driver = self.driver
        driver.get(BASE_URL)

        # 1. Signup Flow
        print("Step: Navigating to Sign Up")
        try:
             try:
                 signup_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Get Started')]")))
             except:
                 signup_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Sign up')]")))
             
             signup_btn.click()
        except Exception as e:
             print(f"DEBUG: Failed to find signup button. Current URL: {driver.current_url}")
             print(f"DEBUG: Page Title: {driver.title}")
             driver.get(f"{BASE_URL}/register")

        print("Step: Filling Registration Form")
        time.sleep(2)
        try:
            self.wait.until(EC.visibility_of_element_located((By.XPATH, "//h1[contains(text(), 'Create an Account')]")))
        except Exception as e:
            print(f"DEBUG: Timeout waiting for 'Create an Account'. Source fragment: {driver.page_source[:500]}")
            raise e
        
        name_input = driver.find_element(By.XPATH, "//input[@placeholder='John Doe']")
        email_input = driver.find_element(By.CSS_SELECTOR, "input[type='email']")
        pass_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")

        name_input.send_keys(USER_NAME)
        email_input.send_keys(USER_EMAIL)
        pass_input.send_keys(USER_PASSWORD)

        submit_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Create Account')]")
        submit_btn.click()
        time.sleep(2)

        # 2. Onboarding Flow
        print("Step: Starting Onboarding")
        self.wait.until(EC.url_contains("onboarding"))
        
        # Etape 1: Age
        print(" - Onboarding: Age")
        time.sleep(1)
        
        age_input = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[type='number']")))
        
        # DEBUG: Check value before
        print(f"DEBUG: Age Before = '{age_input.get_attribute('value')}'")
        
        # SOLUTION: Utiliser la méthode robuste pour React
        # D'abord, cliquer sur l'input pour le focus
        age_input.click()
        time.sleep(0.3)
        
        # Effacer le contenu existant
        age_input.send_keys(Keys.CONTROL + "a")
        age_input.send_keys(Keys.DELETE)
        
        # Utiliser la méthode robuste pour définir la valeur
        self.set_react_input_value(age_input, "30")
        
        time.sleep(0.5)
        
        # DEBUG: Check value after
        print(f"DEBUG: Age After = '{age_input.get_attribute('value')}'")
        
        # Vérifier si le bouton Next est activé
        try:
             next_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Next')]")
             is_enabled = next_btn.is_enabled()
             print(f"DEBUG: Next button enabled = {is_enabled}")
             if not is_enabled:
                 # Alternative: simuler la frappe caractère par caractère
                 print("DEBUG: Trying alternative method - sending keys one by one")
                 age_input.click()
                 age_input.send_keys(Keys.CONTROL + "a")
                 time.sleep(0.1)
                 for char in "30":
                     age_input.send_keys(char)
                     time.sleep(0.1)
        except Exception as e:
             print(f"DEBUG: Error checking Next button: {e}")

        self.click_next()

        # Etape 2: Experience
        print(" - Onboarding: Experience")
        self.wait.until(EC.element_to_be_clickable((By.XPATH, "//h3[contains(text(), 'Beginner')]"))).click()
        self.click_next()

        # Etape 3: Risk Tolerance
        print(" - Onboarding: Risk Tolerance")
        self.wait.until(EC.element_to_be_clickable((By.XPATH, "//h3[contains(text(), 'Medium')]"))).click()
        self.click_next()

        # Etape 4: Initial Investment
        print(" - Onboarding: Initial Investment")
        time.sleep(1)
        self.click_next()

        # Etape 5: Monthly Budget
        print(" - Onboarding: Monthly Budget")
        time.sleep(1)
        self.click_next()

        # Etape 6: Goals
        print(" - Onboarding: Goals")
        self.wait.until(EC.element_to_be_clickable((By.XPATH, "//span[contains(text(), 'Retirement')]"))).click()
        self.click_next()

        # Etape 7: Sectors
        print(" - Onboarding: Sectors")
        self.wait.until(EC.element_to_be_clickable((By.XPATH, "//span[contains(text(), 'Technology')]"))).click()
        self.click_next()

        # Etape 8: Countries
        print(" - Onboarding: Countries")
        self.wait.until(EC.element_to_be_clickable((By.XPATH, "//span[contains(text(), 'USA')]"))).click()
        self.click_next()

        # Etape 9: Summary
        print(" - Onboarding: Summary & Finish")
        finish_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Finish')]")))
        finish_btn.click()

        # Verify Dashboard
        print("Step: Verifying Dashboard")
        self.wait.until(EC.url_contains("dashboard"))
        self.wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'Hello,')]")))
        print("PASSED: Signup and Onboarding complete.")

    def test_02_login(self):
        """Test: Login avec le compte créé"""
        print(f"\n--- TEST 2: LOGIN (User: {USER_EMAIL}) ---")
        driver = self.driver
        driver.get(f"{BASE_URL}/login")

        print("Step: Navigate to Login Page (if redirected to Landing)")
        try:
             login_nav_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Log In')]")))
             print("DEBUG: On Landing Page, clicking 'Log In'...")
             login_nav_btn.click()
        except:
             print("DEBUG: Assuming already on Login Page")

        print("Step: Filling Login Credentials")
        email_input = self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='email']")))
        pass_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")

        email_input.send_keys(USER_EMAIL)
        pass_input.send_keys(USER_PASSWORD)

        signin_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Sign In')]")
        signin_btn.click()
        time.sleep(2)

        print("Step: Verifying Login Success")
        self.wait.until(EC.url_contains("dashboard"))
        self.wait.until(EC.presence_of_element_located((By.XPATH, "//button[contains(text(), 'Add New Asset')]")))
        print("PASSED: Login successful.")

    def test_03_edit_profile(self):
        """Test: Modification du profil"""
        print("\n--- TEST 3: EDIT PROFILE ---")
        self.login_helper()

        print("Step: Navigating to Profile")
        self.driver.get(f"{BASE_URL}/profile")
        
        print("Step: Modifying Risk Tolerance")
        strategy_tab = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Strategy')]")))
        strategy_tab.click()

        time.sleep(1)
        select_element = self.wait.until(EC.presence_of_element_located((By.XPATH, "//select[./option[@value='high']]")))
        select = Select(select_element)
        select.select_by_value("high")

        print("Step: Saving Changes")
        save_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Save Changes')]")
        save_btn.click()

        print("Step: Verifying Success")
        self.wait.until(EC.presence_of_element_located((By.XPATH, "//span[contains(text(), 'Profile updated successfully')]")))
        print("PASSED: Profile updated.")

    def test_04_buy_asset(self):
        """Test: Achat d'une action (AAPL)"""
        print("\n--- TEST 4: BUY ASSET (AAPL) ---")
        self.login_helper()

        print("Step: Opening Buy Modal")
        try:
            add_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Add New Asset')]")))
        except:
             add_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Add your first asset')]")))
        add_btn.click()

        print("Step: Filling Asset Details")
        symbol_input = self.wait.until(EC.visibility_of_element_located((By.XPATH, "//input[@placeholder='AAPL']")))
        name_input = self.driver.find_element(By.XPATH, "//input[@placeholder='Apple Inc.']")
        qty_input = self.driver.find_element(By.XPATH, "//input[@placeholder='0.00' or @placeholder='Amount to purchase']")
        price_input = self.driver.find_element(By.XPATH, "//input[@placeholder='$0.00']")

        symbol_input.send_keys("AAPL")
        name_input.send_keys("Apple Test")
        qty_input.send_keys("10")
        price_input.send_keys("150")

        print("Step: Confirming Purchase")
        confirm_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Add Asset')]")
        confirm_btn.click()

        print("Step: Verifying Asset in List")
        self.wait.until(EC.invisibility_of_element_located((By.XPATH, "//h3[contains(text(), 'Add New Asset')]")))
        self.wait.until(EC.visibility_of_element_located((By.XPATH, "//p[contains(text(), 'AAPL')]")))
        print("PASSED: Asset purchased.")

    def test_05_close_position(self):
        """Test: Vente/Clôture de la position AAPL"""
        print("\n--- TEST 5: CLOSE POSITION ---")
        self.login_helper()
        
        print("Step: Clicking Sell Button for AAPL")
        sell_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@title='Sell Position']")))
        sell_btn.click()

        print("Step: Confirming Sale")
        self.wait.until(EC.visibility_of_element_located((By.XPATH, "//h3[contains(text(), 'Sell Position')]")))
        
        price_input = self.driver.find_element(By.XPATH, "//input[@type='number']")
        price_input.clear()
        price_input.send_keys("160")

        confirm_sell_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Confirm Sale')]")
        confirm_sell_btn.click()

        print("Step: Verifying Sale Success")
        self.wait.until(EC.alert_is_present())
        alert = self.driver.switch_to.alert
        print(f"Alert Text: {alert.text}")
        alert.accept()
        
        self.wait.until(EC.invisibility_of_element_located((By.XPATH, "//p[contains(text(), 'AAPL')]")))
        print("PASSED: Position closed.")

    # --- HELPERS ---
    def click_next(self):
        """Helper to click the Next/Continue button in onboarding"""
        next_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Next')]")))
        next_btn.click()
        time.sleep(0.5)  # Small delay for transitions

    def login_helper(self):
        """Helper to log in quickly if not already logged in"""
        driver = self.driver
        if driver.current_url == "data:,":
            driver.get(BASE_URL)
            
        time.sleep(1)
        if "dashboard" in driver.current_url:
            return

        print("DEBUG: login_helper triggering login...")
        self.test_02_login()

if __name__ == "__main__":
    unittest.main()
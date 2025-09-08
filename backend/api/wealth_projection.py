def calculate_wealth_projection(data):
    """
    Calculate wealth projection based on input parameters with 4 scenarios.
    
    Args:
        data (dict): Dictionary containing:
            - age (int): Current age
            - maxAge (int): Maximum age for projection
            - startWealth (float): Starting wealth (W₀)
            - debt (float): Total debt (ignored in first version)
            - debtInterest (float): Debt interest rate (ignored in first version)
            - assetInterest (float): Asset interest rate (rₐ)
            - inflation (float): Expected inflation rate (i)
            - taxRate (float): Tax rate (t)
            - annualContributions (float): Annual contributions (C)
            - checkingInterest (float): Checking account interest rate (r𝚌)
    
    Returns:
        list: List of dictionaries containing year-by-year projections for 4 scenarios
    """
    # Convert percentage rates to decimals
    asset_interest_rate = float(data['assetInterest']) / 100
    inflation_rate = float(data['inflation']) / 100
    tax_rate = float(data['taxRate']) / 100
    checking_interest_rate = float(data.get('checkingInterest', 4)) / 100  # Default to 4% if not provided
    
    # Initialize values
    current_age = int(data['age'])
    max_age = int(data.get('maxAge', 100))  # Default to 100 if not provided
    years_to_project = max_age - current_age
    annual_contribution = float(data['annualContributions'])
    
    # Initialize wealth for all 4 scenarios
    W0 = float(data['startWealth'])  # Starting wealth
    
    # Store projections
    projections = []
    
    # Add the first data point with original input values (no calculations applied)
    projections.append({
        'year': 0,
        'age': current_age,
        'scenario_1': round(W0, 2),  # Investment Growth After Tax
        'scenario_2': round(W0, 2),  # Investment Growth After Tax & Inflation
        'scenario_3': round(W0, 2),  # Checking Account Growth (No Taxes)
        'scenario_4': round(W0, 2),  # Checking Account Growth After Tax
        'wealth': round(W0, 2),  # Keep original field for backward compatibility
        'debt': 0,  # Ignore debt in first version
        'net_worth': round(W0, 2),
        'adjusted_wealth': round(W0, 2),
        'adjusted_debt': 0,
        'adjusted_net_worth': round(W0, 2),
        'checking_wealth': round(W0, 2),
        'adjusted_checking_wealth': round(W0, 2)
    })
    
    # Initialize wealth values for each scenario
    W1 = W0  # Investment Growth After Tax
    W2 = W0  # Investment Growth After Tax & Inflation  
    W3 = W0  # Checking Account Growth (No Taxes)
    W4 = W0  # Checking Account Growth After Tax
    
    # Calculate for the remaining years (starting from year 1)
    for year in range(1, years_to_project + 1):
        # Scenario 1: Investment Growth After Tax
        # Wₙ₊₁ = (Wₙ + C) × (1 + rₐ × (1 - t))
        W1 = (W1 + annual_contribution) * (1 + asset_interest_rate * (1 - tax_rate))
        
        # Scenario 2: Investment Growth After Tax & Inflation
        # Wₙ₊₁ = (Wₙ + C) × (1 + (rₐ × (1 - t)) - i)
        W2 = (W2 + annual_contribution) * (1 + (asset_interest_rate * (1 - tax_rate)) - inflation_rate)
        
        # Scenario 3: Checking Account Growth (No Taxes)
        # Wₙ₊₁ = (Wₙ + C) × (1 + r𝚌)
        W3 = (W3 + annual_contribution) * (1 + checking_interest_rate)
        
        # Scenario 4: Checking Account Growth After Tax
        # Wₙ₊₁ = (Wₙ + C) × (1 + r𝚌 × (1 - t))
        W4 = (W4 + annual_contribution) * (1 + checking_interest_rate * (1 - tax_rate))
        
        # Store projection for this year
        projections.append({
            'year': year,
            'age': current_age + year,
            'scenario_1': round(W1, 2),  # Investment Growth After Tax
            'scenario_2': round(W2, 2),  # Investment Growth After Tax & Inflation
            'scenario_3': round(W3, 2),  # Checking Account Growth (No Taxes)
            'scenario_4': round(W4, 2),  # Checking Account Growth After Tax
            'wealth': round(W1, 2),  # Keep original field for backward compatibility
            'debt': 0,  # Ignore debt in first version
            'net_worth': round(W1, 2),
            'adjusted_wealth': round(W1 / ((1 + inflation_rate) ** year), 2),
            'adjusted_debt': 0,
            'adjusted_net_worth': round(W1 / ((1 + inflation_rate) ** year), 2),
            'checking_wealth': round(W3, 2),
            'adjusted_checking_wealth': round(W3 / ((1 + inflation_rate) ** year), 2)
        })
    
    return projections 
def calculate_wealth_projection(data):
    """
    Calculate wealth projection for 100 years based on input parameters.
    
    Args:
        data (dict): Dictionary containing:
            - age (int): Current age
            - startWealth (float): Starting wealth
            - debt (float): Total debt
            - debtInterest (float): Debt interest rate (percentage)
            - assetInterest (float): Asset interest rate (percentage)
            - inflation (float): Expected inflation rate (percentage)
            - taxRate (float): Tax rate (percentage)
            - annualContributions (float): Annual contributions
    
    Returns:
        list: List of dictionaries containing year-by-year projections
    """
    # Convert percentage rates to decimals
    debt_interest_rate = float(data['debtInterest']) / 100
    asset_interest_rate = float(data['assetInterest']) / 100
    inflation_rate = float(data['inflation']) / 100
    tax_rate = float(data['taxRate']) / 100
    
    # Initialize values
    current_age = int(data['age'])
    wealth = float(data['startWealth'])
    debt = float(data['debt'])
    annual_contribution = float(data['annualContributions'])
    
    # Store projections
    projections = []
    
    # Calculate for 100 years
    for year in range(100):
        # Calculate interest on assets (after tax)
        asset_interest = wealth * asset_interest_rate
        asset_interest_after_tax = asset_interest * (1 - tax_rate)
        
        # Calculate interest on debt
        debt_interest = debt * debt_interest_rate
        
        # Update wealth and debt
        wealth += asset_interest_after_tax + annual_contribution
        debt += debt_interest
        
        # Adjust for inflation
        inflation_factor = (1 + inflation_rate) ** year
        adjusted_wealth = wealth / inflation_factor
        adjusted_debt = debt / inflation_factor
        
        # Store projection for this year
        projections.append({
            'year': year,
            'age': current_age + year,
            'wealth': round(wealth, 2),
            'debt': round(debt, 2),
            'net_worth': round(wealth - debt, 2),
            'adjusted_wealth': round(adjusted_wealth, 2),
            'adjusted_debt': round(adjusted_debt, 2),
            'adjusted_net_worth': round(adjusted_wealth - adjusted_debt, 2)
        })
    
    return projections 
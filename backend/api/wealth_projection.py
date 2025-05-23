def calculate_wealth_projection(data):
    """
    Calculate wealth projection based on input parameters.
    
    Args:
        data (dict): Dictionary containing:
            - age (int): Current age
            - maxAge (int): Maximum age for projection
            - startWealth (float): Starting wealth
            - debt (float): Total debt
            - debtInterest (float): Debt interest rate (percentage)
            - assetInterest (float): Asset interest rate (percentage)
            - inflation (float): Expected inflation rate (percentage)
            - taxRate (float): Tax rate (percentage)
            - annualContributions (float): Annual contributions
            - checkingInterest (float): Checking account interest rate (percentage)
    
    Returns:
        list: List of dictionaries containing year-by-year projections
    """
    # Convert percentage rates to decimals
    debt_interest_rate = float(data['debtInterest']) / 100
    asset_interest_rate = float(data['assetInterest']) / 100
    inflation_rate = float(data['inflation']) / 100
    tax_rate = float(data['taxRate']) / 100
    checking_interest_rate = float(data.get('checkingInterest', 4)) / 100  # Default to 4% if not provided
    
    # Initialize values
    current_age = int(data['age'])
    max_age = int(data.get('maxAge', 100))  # Default to 100 if not provided
    years_to_project = max_age - current_age
    wealth = float(data['startWealth'])
    debt = float(data['debt'])
    annual_contribution = float(data['annualContributions'])
    checking_wealth = float(data['startWealth'])  # Initialize checking account wealth
    
    # Store projections
    projections = []
    
    # Calculate for the specified number of years
    for year in range(years_to_project + 1):
        # Calculate interest on assets (after tax)
        asset_interest = wealth * asset_interest_rate
        asset_interest_after_tax = asset_interest * (1 - tax_rate)
        
        # Calculate interest on debt
        debt_interest = debt * debt_interest_rate
        
        # Calculate checking account interest (after tax)
        checking_interest = checking_wealth * checking_interest_rate
        checking_interest_after_tax = checking_interest * (1 - tax_rate)
        
        # Update debt first (add interest and subtract available contribution)
        debt += debt_interest
        remaining_contribution = annual_contribution
        if debt > 0:
            debt_payment = min(debt, remaining_contribution)
            debt -= debt_payment
            remaining_contribution -= debt_payment
        
        # Update wealth with remaining contribution
        wealth += asset_interest_after_tax + remaining_contribution
        checking_wealth += checking_interest_after_tax + remaining_contribution
        
        # Adjust for inflation
        inflation_factor = (1 + inflation_rate) ** year
        adjusted_wealth = wealth / inflation_factor
        adjusted_debt = debt / inflation_factor
        adjusted_checking_wealth = checking_wealth / inflation_factor
        
        # Store projection for this year
        projections.append({
            'year': year,
            'age': current_age + year,
            'wealth': round(wealth, 2),
            'debt': round(debt, 2),
            'net_worth': round(wealth - debt, 2),
            'adjusted_wealth': round(adjusted_wealth, 2),
            'adjusted_debt': round(adjusted_debt, 2),
            'adjusted_net_worth': round(adjusted_wealth - adjusted_debt, 2),
            'checking_wealth': round(checking_wealth, 2),
            'adjusted_checking_wealth': round(adjusted_checking_wealth, 2)
        })
    
    return projections 
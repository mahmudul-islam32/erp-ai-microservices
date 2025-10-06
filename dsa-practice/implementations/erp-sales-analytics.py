# ERP Sales Analytics - Real Implementation
# This file demonstrates how Two Sum concept is used in our ERP system

from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class SalesTransaction:
    id: str
    amount: float
    date: datetime
    customer_id: str
    product_ids: List[str]
    salesperson_id: str

@dataclass
class SalesMatchResult:
    found: bool
    transactions: List[SalesTransaction]
    total_amount: float
    difference: float

class SalesAnalytics:
    def __init__(self, sales_data: List[SalesTransaction]):
        self.sales_data = sales_data

    def find_transactions_by_target_amount(self, target_amount: float) -> SalesMatchResult:
        """
        Find two sales transactions that sum to target amount using Two Sum algorithm
        Time Complexity: O(n)
        Space Complexity: O(n)
        """
        amount_map = {}
        
        for transaction in self.sales_data:
            complement = target_amount - transaction.amount
            if complement in amount_map:
                complement_transaction = amount_map[complement]
                total_amount = complement_transaction.amount + transaction.amount
                
                return SalesMatchResult(
                    found=True,
                    transactions=[complement_transaction, transaction],
                    total_amount=total_amount,
                    difference=0.0
                )
            amount_map[transaction.amount] = transaction

        return SalesMatchResult(
            found=False,
            transactions=[],
            total_amount=0.0,
            difference=target_amount
        )

    def find_daily_sales_combinations(self, target_amount: float, date: datetime) -> List[SalesMatchResult]:
        """
        Find sales combinations for a specific date
        """
        daily_sales = [s for s in self.sales_data if s.date.date() == date.date()]
        daily_optimizer = SalesAnalytics(daily_sales)
        
        results = []
        used_transactions = set()
        
        for i, transaction1 in enumerate(daily_sales):
            if transaction1.id in used_transactions:
                continue
                
            for j, transaction2 in enumerate(daily_sales[i+1:], i+1):
                if transaction2.id in used_transactions:
                    continue
                    
                if abs((transaction1.amount + transaction2.amount) - target_amount) < 0.01:
                    results.append(SalesMatchResult(
                        found=True,
                        transactions=[transaction1, transaction2],
                        total_amount=transaction1.amount + transaction2.amount,
                        difference=0.0
                    ))
                    used_transactions.add(transaction1.id)
                    used_transactions.add(transaction2.id)
        
        return results

    def find_salesperson_performance_pairs(self, target_amount: float) -> Dict[str, List[SalesMatchResult]]:
        """
        Find salesperson pairs that achieved target amount
        """
        salesperson_sales = {}
        
        # Group sales by salesperson
        for transaction in self.sales_data:
            if transaction.salesperson_id not in salesperson_sales:
                salesperson_sales[transaction.salesperson_id] = []
            salesperson_sales[transaction.salesperson_id].append(transaction)
        
        results = {}
        
        # Find combinations within each salesperson's sales
        for salesperson_id, transactions in salesperson_sales.items():
            if len(transactions) < 2:
                continue
                
            combinations = []
            for i in range(len(transactions)):
                for j in range(i + 1, len(transactions)):
                    total_amount = transactions[i].amount + transactions[j].amount
                    if abs(total_amount - target_amount) < 0.01:
                        combinations.append(SalesMatchResult(
                            found=True,
                            transactions=[transactions[i], transactions[j]],
                            total_amount=total_amount,
                            difference=0.0
                        ))
            
            if combinations:
                results[salesperson_id] = combinations
        
        return results

    def find_customer_purchase_patterns(self, target_amount: float) -> Dict[str, List[SalesMatchResult]]:
        """
        Find customer purchase patterns that sum to target amount
        """
        customer_sales = {}
        
        # Group sales by customer
        for transaction in self.sales_data:
            if transaction.customer_id not in customer_sales:
                customer_sales[transaction.customer_id] = []
            customer_sales[transaction.customer_id].append(transaction)
        
        results = {}
        
        # Find combinations within each customer's purchases
        for customer_id, transactions in customer_sales.items():
            if len(transactions) < 2:
                continue
                
            combinations = []
            for i in range(len(transactions)):
                for j in range(i + 1, len(transactions)):
                    total_amount = transactions[i].amount + transactions[j].amount
                    if abs(total_amount - target_amount) < 0.01:
                        combinations.append(SalesMatchResult(
                            found=True,
                            transactions=[transactions[i], transactions[j]],
                            total_amount=total_amount,
                            difference=0.0
                        ))
            
            if combinations:
                results[customer_id] = combinations
        
        return results

    def analyze_sales_target_achievement(self, monthly_target: float) -> Dict[str, any]:
        """
        Analyze how sales combinations contribute to monthly targets
        """
        monthly_sales = {}
        
        # Group sales by month
        for transaction in self.sales_data:
            month_key = transaction.date.strftime('%Y-%m')
            if month_key not in monthly_sales:
                monthly_sales[month_key] = []
            monthly_sales[month_key].append(transaction)
        
        results = {}
        
        for month, transactions in monthly_sales.items():
            total_sales = sum(t.amount for t in transactions)
            target_achievement = total_sales / monthly_target if monthly_target > 0 else 0
            
            # Find combinations that could help reach target
            combinations = []
            for i in range(len(transactions)):
                for j in range(i + 1, len(transactions)):
                    combination_amount = transactions[i].amount + transactions[j].amount
                    if combination_amount >= monthly_target * 0.1:  # At least 10% of target
                        combinations.append(SalesMatchResult(
                            found=True,
                            transactions=[transactions[i], transactions[j]],
                            total_amount=combination_amount,
                            difference=0.0
                        ))
            
            results[month] = {
                'total_sales': total_sales,
                'target_achievement': target_achievement,
                'target_met': total_sales >= monthly_target,
                'significant_combinations': combinations[:5]  # Top 5 combinations
            }
        
        return results

# Example usage and testing
def example_usage():
    from datetime import datetime, timedelta
    
    # Sample sales data
    sample_sales = [
        SalesTransaction('1', 500.0, datetime.now() - timedelta(days=1), 'C001', ['P001'], 'S001'),
        SalesTransaction('2', 300.0, datetime.now() - timedelta(days=1), 'C002', ['P002'], 'S002'),
        SalesTransaction('3', 200.0, datetime.now() - timedelta(days=2), 'C001', ['P003'], 'S001'),
        SalesTransaction('4', 800.0, datetime.now() - timedelta(days=2), 'C003', ['P004'], 'S003'),
        SalesTransaction('5', 150.0, datetime.now() - timedelta(days=3), 'C002', ['P005'], 'S002'),
        SalesTransaction('6', 350.0, datetime.now() - timedelta(days=3), 'C003', ['P006'], 'S003'),
    ]

    analytics = SalesAnalytics(sample_sales)
    
    # Test 1: Find transactions that sum to $800
    result1 = analytics.find_transactions_by_target_amount(800.0)
    print(f"Transactions for $800: {result1}")
    
    # Test 2: Find daily sales combinations
    today = datetime.now().date()
    result2 = analytics.find_daily_sales_combinations(800.0, datetime.now())
    print(f"Daily combinations for $800: {result2}")
    
    # Test 3: Find salesperson performance pairs
    result3 = analytics.find_salesperson_performance_pairs(500.0)
    print(f"Salesperson pairs for $500: {result3}")
    
    # Test 4: Analyze monthly target achievement
    result4 = analytics.analyze_sales_target_achievement(1000.0)
    print(f"Monthly target analysis: {result4}")

if __name__ == "__main__":
    example_usage()

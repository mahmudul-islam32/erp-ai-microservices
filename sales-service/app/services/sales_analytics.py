# Sales Analytics Service - Two Sum Implementation
# This service finds sales combinations that meet targets using Two Sum algorithm

from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum

class SalesTargetType(Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"

@dataclass
class SalesTransaction:
    id: str
    amount: float
    date: datetime
    customer_id: str
    product_ids: List[str]
    salesperson_id: str
    status: str = "completed"

@dataclass
class SalesTargetResult:
    found: bool
    transactions: List[SalesTransaction]
    total_amount: float
    difference: float
    target_achievement: float

class SalesAnalyticsService:
    def __init__(self, sales_data: List[SalesTransaction]):
        self.sales_data = sales_data

    def find_transactions_by_target_amount(self, target_amount: float) -> SalesTargetResult:
        """
        Find two sales transactions that sum to target amount using Two Sum algorithm
        Time Complexity: O(n)
        Space Complexity: O(n)
        """
        amount_map = {}
        
        for transaction in self.sales_data:
            if transaction.status != "completed":
                continue
                
            complement = target_amount - transaction.amount
            if complement in amount_map:
                complement_transaction = amount_map[complement]
                total_amount = complement_transaction.amount + transaction.amount
                target_achievement = (total_amount / target_amount) * 100 if target_amount > 0 else 0
                
                return SalesTargetResult(
                    found=True,
                    transactions=[complement_transaction, transaction],
                    total_amount=total_amount,
                    difference=0.0,
                    target_achievement=target_achievement
                )
            amount_map[transaction.amount] = transaction

        return SalesTargetResult(
            found=False,
            transactions=[],
            total_amount=0.0,
            difference=target_amount,
            target_achievement=0.0
        )

    def find_daily_sales_combinations(self, target_amount: float, date: datetime) -> List[SalesTargetResult]:
        """
        Find sales combinations for a specific date using Two Sum concept
        """
        daily_sales = [s for s in self.sales_data if s.date.date() == date.date() and s.status == "completed"]
        results = []
        used_transactions = set()
        
        for i, transaction1 in enumerate(daily_sales):
            if transaction1.id in used_transactions:
                continue
                
            for j, transaction2 in enumerate(daily_sales[i+1:], i+1):
                if transaction2.id in used_transactions:
                    continue
                    
                total_amount = transaction1.amount + transaction2.amount
                if abs(total_amount - target_amount) < 0.01:
                    target_achievement = (total_amount / target_amount) * 100 if target_amount > 0 else 0
                    results.append(SalesTargetResult(
                        found=True,
                        transactions=[transaction1, transaction2],
                        total_amount=total_amount,
                        difference=0.0,
                        target_achievement=target_achievement
                    ))
                    used_transactions.add(transaction1.id)
                    used_transactions.add(transaction2.id)
        
        return results

    def find_salesperson_performance_pairs(self, target_amount: float) -> Dict[str, List[SalesTargetResult]]:
        """
        Find salesperson pairs that achieved target amount
        """
        salesperson_sales = {}
        
        # Group sales by salesperson
        for transaction in self.sales_data:
            if transaction.status != "completed":
                continue
                
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
                        target_achievement = (total_amount / target_amount) * 100 if target_amount > 0 else 0
                        combinations.append(SalesTargetResult(
                            found=True,
                            transactions=[transactions[i], transactions[j]],
                            total_amount=total_amount,
                            difference=0.0,
                            target_achievement=target_achievement
                        ))
            
            if combinations:
                results[salesperson_id] = combinations
        
        return results

    def analyze_monthly_target_achievement(self, monthly_target: float, year: int, month: int) -> Dict[str, any]:
        """
        Analyze how sales combinations contribute to monthly targets
        """
        # Filter sales for the specific month
        monthly_sales = [
            t for t in self.sales_data 
            if t.date.year == year and t.date.month == month and t.status == "completed"
        ]
        
        total_sales = sum(t.amount for t in monthly_sales)
        target_achievement = (total_sales / monthly_target) * 100 if monthly_target > 0 else 0
        
        # Find significant combinations that contributed to the target
        significant_combinations = []
        for i in range(len(monthly_sales)):
            for j in range(i + 1, len(monthly_sales)):
                combination_amount = monthly_sales[i].amount + monthly_sales[j].amount
                if combination_amount >= monthly_target * 0.1:  # At least 10% of target
                    target_achievement_contribution = (combination_amount / monthly_target) * 100
                    significant_combinations.append({
                        'transactions': [monthly_sales[i], monthly_sales[j]],
                        'amount': combination_amount,
                        'contribution_percentage': target_achievement_contribution
                    })
        
        # Sort by contribution percentage
        significant_combinations.sort(key=lambda x: x['contribution_percentage'], reverse=True)
        
        return {
            'month': f"{year}-{month:02d}",
            'total_sales': total_sales,
            'target': monthly_target,
            'target_achievement': target_achievement,
            'target_met': total_sales >= monthly_target,
            'significant_combinations': significant_combinations[:5],  # Top 5 combinations
            'total_transactions': len(monthly_sales)
        }

    def find_closest_target_achievement(self, target_amount: float) -> SalesTargetResult:
        """
        Find the closest sales combination to target amount
        """
        best_match = SalesTargetResult(
            found=False,
            transactions=[],
            total_amount=0.0,
            difference=float('inf'),
            target_achievement=0.0
        )

        for i in range(len(self.sales_data)):
            if self.sales_data[i].status != "completed":
                continue
                
            for j in range(i + 1, len(self.sales_data)):
                if self.sales_data[j].status != "completed":
                    continue
                    
                total_amount = self.sales_data[i].amount + self.sales_data[j].amount
                difference = abs(target_amount - total_amount)
                
                if difference < best_match.difference:
                    target_achievement = (total_amount / target_amount) * 100 if target_amount > 0 else 0
                    best_match = SalesTargetResult(
                        found=True,
                        transactions=[self.sales_data[i], self.sales_data[j]],
                        total_amount=total_amount,
                        difference=difference,
                        target_achievement=target_achievement
                    )

        return best_match

    def get_sales_insights(self, target_amount: float) -> Dict[str, any]:
        """
        Get comprehensive sales insights using Two Sum analysis
        """
        # Find exact matches
        exact_matches = self.find_transactions_by_target_amount(target_amount)
        
        # Find closest matches
        closest_matches = self.find_closest_target_achievement(target_amount)
        
        # Find salesperson performance
        salesperson_performance = self.find_salesperson_performance_pairs(target_amount)
        
        # Calculate overall statistics
        total_sales = sum(t.amount for t in self.sales_data if t.status == "completed")
        average_transaction = total_sales / len([t for t in self.sales_data if t.status == "completed"]) if self.sales_data else 0
        
        return {
            'target_amount': target_amount,
            'exact_matches': exact_matches,
            'closest_matches': closest_matches,
            'salesperson_performance': salesperson_performance,
            'total_sales': total_sales,
            'average_transaction': average_transaction,
            'total_transactions': len([t for t in self.sales_data if t.status == "completed"]),
            'target_achievement_rate': (total_sales / target_amount) * 100 if target_amount > 0 else 0
        }

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

    analytics = SalesAnalyticsService(sample_sales)
    
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
    current_date = datetime.now()
    result4 = analytics.analyze_monthly_target_achievement(1000.0, current_date.year, current_date.month)
    print(f"Monthly target analysis: {result4}")
    
    # Test 5: Get comprehensive insights
    result5 = analytics.get_sales_insights(1000.0)
    print(f"Sales insights: {result5}")

if __name__ == "__main__":
    example_usage()


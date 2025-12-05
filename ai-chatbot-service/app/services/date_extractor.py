"""
Date extraction and parsing utilities for user queries
"""
import re
from datetime import date, datetime, timedelta
from typing import Optional, Tuple, List
from calendar import monthrange


def extract_month_from_query(query: str) -> Optional[str]:
    """Extract month name from query (e.g., 'november', 'december')"""
    month_names = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
    ]
    
    query_lower = query.lower()
    for month in month_names:
        if month in query_lower:
            return month
    
    return None


def extract_date_range_from_query(query: str) -> Optional[Tuple[date, date, str]]:
    """
    Extract date range from user query
    Returns: (start_date, end_date, description) or None
    """
    query_lower = query.lower()
    today = date.today()
    
    # Check for specific month names FIRST (e.g., "sales november", "november sales")
    # This must come first to catch month names before they're treated as other entities
    month_name = extract_month_from_query(query)
    if month_name:
        # Check if year is mentioned with month (e.g., "november 2025")
        year_pattern = r'\b' + re.escape(month_name) + r'\s+(\d{4})\b'
        year_match = re.search(year_pattern, query_lower)
        if year_match:
            year = int(year_match.group(1))
            return get_month_date_range(month_name, year)
        else:
            return get_month_date_range(month_name, today.year)
    
    # Check for relative dates
    if 'last month' in query_lower:
        if today.month == 1:
            start = date(today.year - 1, 12, 1)
            end = date(today.year - 1, 12, 31)
        else:
            start = date(today.year, today.month - 1, 1)
            last_day = monthrange(today.year, today.month - 1)[1]
            end = date(today.year, today.month - 1, last_day)
        return (start, end, f"last month ({start.strftime('%B %Y')})")
    
    if 'this month' in query_lower or 'current month' in query_lower:
        start = today.replace(day=1)
        return (start, today, f"this month ({start.strftime('%B %Y')})")
    
    # Check for "for [month]" pattern
    month_pattern = r'\b(for|in)\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b'
    match = re.search(month_pattern, query_lower)
    if match:
        month_name = match.group(2)
        return get_month_date_range(month_name, today.year)
    
    # Check for year mentioned with month
    month_year_pattern = r'\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\b'
    match = re.search(month_year_pattern, query_lower)
    if match:
        month_name = match.group(1)
        year = int(match.group(2))
        return get_month_date_range(month_name, year)
    
    return None


def get_month_date_range(month_name: str, year: Optional[int] = None) -> Tuple[date, date, str]:
    """Get start and end date for a specific month"""
    month_map = {
        'january': 1, 'february': 2, 'march': 3, 'april': 4,
        'may': 5, 'june': 6, 'july': 7, 'august': 8,
        'september': 9, 'october': 10, 'november': 11, 'december': 12
    }
    
    if year is None:
        year = date.today().year
    
    month_num = month_map.get(month_name.lower())
    if not month_num:
        # Default to current month
        today = date.today()
        month_num = today.month
        year = today.year
    
    start = date(year, month_num, 1)
    last_day = monthrange(year, month_num)[1]
    end = date(year, month_num, last_day)
    
    return (start, end, f"{month_name.capitalize()} {year}")


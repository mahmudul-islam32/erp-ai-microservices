# Tests for DSA Implementations

This folder contains comprehensive tests for all DSA implementations in the ERP project.

## Test Structure

### Unit Tests
- `test_two_sum_implementations.py` - Tests for Two Sum implementations
- Individual test files for each DSA concept
- Mock data and edge case testing

### Test Categories

#### 1. Algorithm Tests
- Brute force approach validation
- Hash map approach validation
- Two-pointer approach validation
- Edge case handling

#### 2. ERP Integration Tests
- Inventory optimizer functionality
- Sales analytics accuracy
- Auth permission validation
- Product price matching

#### 3. Performance Tests
- Time complexity validation
- Space complexity validation
- Large dataset handling
- Memory usage optimization

## Running Tests

### Python Tests
```bash
# Run all tests
python -m pytest dsa-practice/implementations/tests/

# Run specific test file
python -m pytest dsa-practice/implementations/tests/test_two_sum_implementations.py

# Run with coverage
python -m pytest --cov=dsa-practice/implementations/ dsa-practice/implementations/tests/
```

### TypeScript Tests
```bash
# Run TypeScript tests
npm test -- dsa-practice/implementations/

# Run with coverage
npm test -- --coverage dsa-practice/implementations/
```

## Test Data

### Sample Inventory
- 5 inventory items with different quantities and prices
- Various categories and stock statuses
- Edge cases for quantity matching

### Sample Sales Data
- 4 sales transactions with different amounts
- Various customers and salespersons
- Different dates for time-based analysis

### Sample User Roles
- 4 different permission levels
- Various permission combinations
- Edge cases for permission validation

## Coverage Goals

- **Unit Tests**: 100% coverage for core algorithms
- **Integration Tests**: 90% coverage for ERP features
- **Edge Cases**: 100% coverage for boundary conditions
- **Performance Tests**: All critical paths tested

## Continuous Integration

Tests are automatically run on:
- Code commits
- Pull requests
- Scheduled nightly builds
- Before production deployments

## Test Reports

Test results are generated in:
- `test-results/` - JUnit XML reports
- `coverage/` - Coverage reports
- `performance/` - Performance benchmarks

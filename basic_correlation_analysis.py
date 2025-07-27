import urllib.request
import csv
from datetime import datetime
import math
from io import StringIO

# 구글 시트 URL 설정
GOOGLE_SHEETS_URLS = {
    'coffeefutures': 'https://docs.google.com/spreadsheets/d/1lnRrdQynfk-XrgYsKmf1_XFCBDa9jLr2XVRib-2lpTk/export?format=csv&gid=442491515',
    'cftcpositions': 'https://docs.google.com/spreadsheets/d/1IgfIFB60VC2f3IGnU5m9xmqkmfOCnnAOYItj9SWKMxc/export?format=csv&gid=0'
}

def fetch_google_sheet_data(sheet_key):
    """구글 시트에서 데이터를 가져옵니다"""
    try:
        url = GOOGLE_SHEETS_URLS[sheet_key]
        print(f"Fetching data from {sheet_key}...")
        
        # URL에서 데이터 가져오기
        with urllib.request.urlopen(url) as response:
            csv_text = response.read().decode('utf-8')
        
        # CSV 데이터 파싱
        csv_reader = csv.reader(StringIO(csv_text))
        data = list(csv_reader)
        
        # 첫 번째 행은 헤더이므로 제외
        processed_data = []
        for row in data[1:]:
            if len(row) >= 2 and row[0] and row[1]:
                try:
                    # 다양한 날짜 형식 시도
                    date_str = row[0].strip()
                    if '/' in date_str:
                        # MM/DD/YYYY 형식
                        date = datetime.strptime(date_str, '%m/%d/%Y')
                    else:
                        # YYYY-MM-DD 형식
                        date = datetime.strptime(date_str, '%Y-%m-%d')
                    value = float(row[1])
                    processed_data.append((date, value))
                except Exception as e:
                    # 디버깅을 위해 첫 몇 개의 오류 출력
                    if len(processed_data) < 5:
                        print(f"  Skipping row: {row[:2]} - Error: {e}")
                    continue
        
        # 날짜순으로 정렬
        processed_data.sort(key=lambda x: x[0])
        
        print(f"Successfully loaded {len(processed_data)} data points from {sheet_key}")
        return processed_data
        
    except Exception as e:
        print(f"Error fetching data from {sheet_key}: {e}")
        return None

def calculate_correlation(x_values, y_values):
    """피어슨 상관계수를 계산합니다"""
    n = len(x_values)
    if n != len(y_values) or n == 0:
        return None
    
    # 평균 계산
    x_mean = sum(x_values) / n
    y_mean = sum(y_values) / n
    
    # 상관계수 계산
    numerator = sum((x - x_mean) * (y - y_mean) for x, y in zip(x_values, y_values))
    x_variance = sum((x - x_mean) ** 2 for x in x_values)
    y_variance = sum((y - y_mean) ** 2 for y in y_values)
    
    if x_variance == 0 or y_variance == 0:
        return 0
    
    correlation = numerator / math.sqrt(x_variance * y_variance)
    return correlation

def analyze_correlation():
    """Coffee futures와 CFTC positions 간의 상관관계를 분석합니다"""
    
    print("=== Coffee Futures vs CFTC Positions Correlation Analysis ===\n")
    
    # 데이터 가져오기
    coffee_data = fetch_google_sheet_data('coffeefutures')
    cftc_data = fetch_google_sheet_data('cftcpositions')
    
    if coffee_data is None or cftc_data is None:
        print("Failed to fetch data")
        return
    
    # 날짜를 키로 하는 딕셔너리 생성
    coffee_dict = {date: value for date, value in coffee_data}
    cftc_dict = {date: value for date, value in cftc_data}
    
    # 공통 날짜 찾기
    common_dates = set(coffee_dict.keys()) & set(cftc_dict.keys())
    common_dates = sorted(list(common_dates))
    
    print(f"\nCommon data points: {len(common_dates)}")
    if len(common_dates) > 0:
        print(f"Date range: {common_dates[0].strftime('%Y-%m-%d')} to {common_dates[-1].strftime('%Y-%m-%d')}")
    
    # 공통 날짜의 값들 추출
    coffee_values = [coffee_dict[date] for date in common_dates]
    cftc_values = [cftc_dict[date] for date in common_dates]
    
    # 상관계수 계산
    correlation = calculate_correlation(coffee_values, cftc_values)
    
    if correlation is not None:
        print(f"\nPearson correlation coefficient: {correlation:.4f}")
        
        # 결과 해석
        print("\n=== CORRELATION ANALYSIS RESULT ===")
        print(f"Overall correlation between Coffee Futures and CFTC Positions: {correlation:.4f}")
        if abs(correlation) > 0.7:
            print(">>> Strong correlation detected! <<<")
            print("This indicates a strong linear relationship between coffee futures prices and CFTC speculative positions.")
        elif abs(correlation) > 0.5:
            print(">>> Moderate correlation detected. <<<")
            print("This indicates a moderate linear relationship between coffee futures prices and CFTC speculative positions.")
        elif abs(correlation) > 0.3:
            print(">>> Weak correlation detected. <<<")
            print("This indicates a weak linear relationship between coffee futures prices and CFTC speculative positions.")
        else:
            print(">>> Very weak or no correlation detected. <<<")
            print("This indicates little to no linear relationship between coffee futures prices and CFTC speculative positions.")
        
        if correlation > 0:
            print("\nPositive correlation: As CFTC net long positions increase, coffee futures prices tend to increase.")
        else:
            print("\nNegative correlation: As CFTC net long positions increase, coffee futures prices tend to decrease.")
    
    # 기본 통계
    print("\n=== Basic Statistics ===")
    if coffee_values:
        coffee_min = min(coffee_values)
        coffee_max = max(coffee_values)
        coffee_mean = sum(coffee_values) / len(coffee_values)
        print(f"\nCoffee Futures:")
        print(f"  Min: {coffee_min:.2f} cents/lb")
        print(f"  Max: {coffee_max:.2f} cents/lb")
        print(f"  Mean: {coffee_mean:.2f} cents/lb")
        print(f"  Range: {coffee_max - coffee_min:.2f} cents/lb")
    
    if cftc_values:
        cftc_min = min(cftc_values)
        cftc_max = max(cftc_values)
        cftc_mean = sum(cftc_values) / len(cftc_values)
        print(f"\nCFTC Net Long Positions:")
        print(f"  Min: {cftc_min:,.0f} contracts")
        print(f"  Max: {cftc_max:,.0f} contracts")
        print(f"  Mean: {cftc_mean:,.0f} contracts")
        print(f"  Range: {cftc_max - cftc_min:,.0f} contracts")
    
    # 최근 데이터 표시
    if len(common_dates) >= 10:
        print("\n=== Recent Data (Last 10 points) ===")
        print(f"{'Date':<12} {'Coffee Futures':<15} {'CFTC Positions':<15}")
        print("-" * 45)
        for i in range(-10, 0):
            date = common_dates[i]
            coffee_val = coffee_dict[date]
            cftc_val = cftc_dict[date]
            print(f"{date.strftime('%Y-%m-%d'):<12} {coffee_val:<15.2f} {cftc_val:<15,.0f}")
    
    # 변화율 상관관계 계산
    if len(coffee_values) > 1:
        coffee_changes = []
        cftc_changes = []
        
        for i in range(1, len(coffee_values)):
            if coffee_values[i-1] != 0 and cftc_values[i-1] != 0:
                coffee_change = (coffee_values[i] - coffee_values[i-1]) / coffee_values[i-1] * 100
                cftc_change = (cftc_values[i] - cftc_values[i-1]) / cftc_values[i-1] * 100
                coffee_changes.append(coffee_change)
                cftc_changes.append(cftc_change)
        
        if len(coffee_changes) > 0:
            change_correlation = calculate_correlation(coffee_changes, cftc_changes)
            if change_correlation is not None:
                print(f"\n=== Percentage Change Correlation ===")
                print(f"Correlation of percentage changes: {change_correlation:.4f}")
                print("This measures how changes in CFTC positions relate to changes in coffee prices.")

if __name__ == "__main__":
    analyze_correlation()
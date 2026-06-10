import requests
import time
import math

def calculate_stats(data):
    if not data:
        return None
    n = len(data)
    mean = sum(data) / n
    variance = sum((x - mean) ** 2 for x in data) / n
    stddev = math.sqrt(variance)
    return {
        "count": n,
        "min": min(data),
        "max": max(data),
        "mean": mean,
        "stddev": stddev
    }

def measure_performance():
    endpoints = {
        "/health": {"method": "GET", "count": 10, "data": None},
        "/trends": {"method": "GET", "count": 5, "data": None},
        "/web_outfit": {"method": "POST", "count": 3, "data": {"test": "data"}}
    }
    
    base_url = "http://localhost:5000"
    results = {}

    max_retries = 15
    print("Checking if server is ready...")
    for i in range(max_retries):
        try:
            requests.get(f"{base_url}/health", timeout=1)
            print("Server is ready.")
            break
        except:
            if i == max_retries - 1:
                print("Server failed to respond on http://localhost:5000")
                return
            time.sleep(2)

    for ep, config in endpoints.items():
        times = []
        for _ in range(config["count"]):
            start = time.perf_counter()
            try:
                if config["method"] == "GET":
                    requests.get(f"{base_url}{ep}", timeout=5)
                else:
                    requests.post(f"{base_url}{ep}", json=config["data"], timeout=5)
                end = time.perf_counter()
                times.append((end - start) * 1000)
            except Exception as e:
                pass
        
        stats = calculate_stats(times)
        if stats:
            results[ep] = stats

    print("Performance Summary (ms):")
    for ep, stats in results.items():
        print(f"{ep}: Count={stats['count']}, Min={stats['min']:.2f}, Max={stats['max']:.2f}, Mean={stats['mean']:.2f}, StdDev={stats['stddev']:.2f}")

if __name__ == "__main__":
    measure_performance()

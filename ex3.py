import math


def get_user_input():
    """Получение данных от пользователя"""

    d1 = float(input("Введите d1 (ярды) => "))
    d2 = float(input("Введите d2 (футы) => "))
    h = float(input("Введите h (ярды) => "))
    v_sand = float(input("Введите v_sand (мили/час) => "))
    n = float(input("Введите коэффициент n => "))

    return d1, d2, h, v_sand, n


def calculate_rescue_time(d1, d2, h, v_sand, n, theta1):
    """Расчёт времени спасения"""

    theta_rad = math.radians(theta1)

    d1_feet = d1 * 3
    h_feet = h * 3

    x = d1_feet * math.tan(theta_rad)

    l1 = math.sqrt(x**2 + d1_feet**2)
    l2 = math.sqrt((h_feet - x)**2 + d2**2)

    t_hours = (l1 + n * l2) / (v_sand * 5280)

    return t_hours * 3600


def find_best_angle(d1, d2, h, v_sand, n):
    """Поиск оптимального угла"""

    best_angle = 0
    min_time = float('inf')

    angle = 0

    while angle <= 89.9:
        time = calculate_rescue_time(
            d1, d2, h, v_sand, n, angle
        )

        if time < min_time:
            min_time = time
            best_angle = angle

        angle += 0.1

    return best_angle, min_time


#тесты
test_time = calculate_rescue_time(
    8, 10, 50, 5, 2, 39.413
)

assert round(test_time, 1) == 39.9

print("Тесты пройдены!")



# программа
d1, d2, h, v_sand, n = get_user_input()

best_angle, min_time = find_best_angle(
    d1, d2, h, v_sand, n
)

print(f"\nОптимальный угол: {best_angle:.1f}°")
print(f"Минимальное время: {min_time:.1f} секунд")

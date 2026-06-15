import math

def get_user_input():
    """Получение данных от пользователя"""

    d1 = float(input("Введите кратчайшее расстояние между спасателем и кромкой воды, d1 (ярды) => "))
    print(d1)

    d2 = float(input("Введите кратчайшее расстояние от утопающего до берега, d2 (футы) => "))
    print(d2)

    h = float(input("Введите боковое смещение между спасателем и утопающим, h (ярды) => "))
    print(h)

    v_sand = float(input("Введите скорость движения спасателя по песку, v_sand (мили в час) => "))
    print(v_sand)

    n = float(input("Введите коэффициент замедления спасателя при движении в воде, n => "))
    print(n)

    theta1 = float(input("Введите направление движения спасателя по песку, theta1 (градусы) => "))
    print(theta1)

    return d1, d2, h, v_sand, n, theta1


def calculate_rescue_time(d1, d2, h, v_sand, n, theta1):
    """Вычисление времени спасения"""

    # перевод градусов
    theta_rad = math.radians(theta1)

    # перевод ярдов в футы
    d1_feet = d1 * 3
    h_feet = h * 3

    # вычисляем x
    x = d1_feet * math.tan(theta_rad)

    # вычисляем расстояния
    l1 = math.sqrt(x**2 + d1_feet**2)
    l2 = math.sqrt((h_feet - x)**2 + d2**2)

    # время в часах
    t_hours = (l1 + n * l2) / (v_sand * 5280)

    # переводим в секунды
    t_seconds = t_hours * 3600

    return t_seconds


def print_result(theta1, time_seconds):
    """Вывод результата"""

    print("Если спасатель начнёт движение под углом")
    print(f"theta1, равным {int(theta1)} градусам, он")
    print(f"достигнет утопающего через {time_seconds:.1f} секунды")


# модульные тесты
test_time = calculate_rescue_time(8, 10, 50, 5, 2, 39.413)

assert round(test_time, 1) == 39.9, "Ошибка в расчёте времени!"

print("Все тесты пройдены успешно!")

#программа
d1, d2, h, v_sand, n, theta1 = get_user_input()

time_seconds = calculate_rescue_time(
    d1, d2, h, v_sand, n, theta1
)

print_result(theta1, time_seconds)

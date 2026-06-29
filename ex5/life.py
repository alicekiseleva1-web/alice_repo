from PIL import Image
# читаем файл
def read_file(filename):
    with open(filename, "r") as f:
        lines = f.readlines()

    # размер
    width, height = map(int, lines[0].split())

    # остальные строки
    field = []
    for line in lines[1:]:
        row = list(map(int, line.split()))
        field.append(row)

    return width, height, field


# считаем соседей
def count_neighbors(x, y, field):
    count = 0

    for dx in [-1, 0, 1]:
        for dy in [-1, 0, 1]:

            nx = x + dx
            ny = y + dy

            # не считаем саму клетку
            if nx == x and ny == y:
                continue

            # проверка границ
            if 0 <= nx < len(field) and 0 <= ny < len(field[0]):

                # проверка на жизнь
                if field[nx][ny] != 0:
                    count += 1

    return count


width, height, field = read_file("input.txt")

# создаём новое поколение
def next_generation(field):
    new_field = []

    for x in range(len(field)):
        new_row = []
        
        for y in range(len(field[0])):
            
            neighbors = count_neighbors(x, y, field)
            cell = field[x][y]
        
            if cell != 0:
                # живая клетка
                if neighbors < 2 or neighbors > 3:
                    new_row.append(0)
                else:
                    # возраст растёт
                    new_row.append(cell + 1)
            else:
                # мёртвая клетка
                if neighbors == 3:
                    new_row.append(1)
                else:
                    new_row.append(0)
                    
        new_field.append(new_row)
        
    return new_field

#сохраняем в файл
def save_field(filename, field, step):
    with open(filename, "a") as f:
        f.write(f"\nStep {step}\n")

        for row in field:
            f.write(" ".join(map(str, row)) + "\n")
            
# сколько шагов
steps = int(input("Введите количество шагов: "))

 #создаём картинку
def save_image(field, step, base_color, cell_size=10):
    height = len(field)
    width = len(field[0])

    img = Image.new("RGB", (width * cell_size, height * cell_size), "white")
    
    for x in range(height):
        for y in range(width):

            value = field[x][y]
            
            if value == 0:
                color = (255, 255, 255)  # белый
            else:
                age = min(value * 20, 200)
                color = (
                    max(base_color[0] - age, 0),
                    max(base_color[1] - age, 0),
                    max(base_color[2] - age, 0)
                    )

            for i in range(cell_size):
                for j in range(cell_size):
                    img.putpixel(
                        (y * cell_size + j, x * cell_size + i),
                        color
                    )
                
    img.save(f"step_{step}.png")

#ввести цвет
base_color = input("Введите цвет (red, green, blue): ")
if base_color == "red":
    base_color = (255, 0, 0)
elif base_color == "green":
    base_color = (0, 255, 0)
elif base_color == "blue":
    base_color = (0, 0, 255)
else:
    base_color = (0, 255, 0)

for i in range(steps):
    print(f"\nШаг {i}")
    for row in field:
        print(row)
    save_field("output.txt", field, i)
    save_image(field, i, base_color)
    field = next_generation(field)

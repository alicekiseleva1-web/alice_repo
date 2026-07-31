import tkinter as tk
from tkinter import ttk

from data import load_markets
from actions import (
    find_by_city,
    get_average_rating
)

## создаем окно
root = tk.Tk()

## заголовок
root.title("Фермерские рынки")

## размер окна
root.geometry("800x600")

## создаем вкладки
tabs = ttk.Notebook(root)
tabs.pack(fill="both", expand=True)

search_tab = tk.Frame(tabs)
info_tab = tk.Frame(tabs)

tabs.add(search_tab, text="Поиск")
tabs.add(info_tab, text="Информация")

## загружаем рынки
markets = load_markets("Export.csv")

## текущие найденные рынки
current_results = []

## вкладка поиск

title = tk.Label(
    search_tab,
    text="Фермерские рынки",
    font=("Arial", 18)
)

title.pack(pady=10)

city_label = tk.Label(
    search_tab,
    text="Введите город"
)

city_label.pack()

city_entry = tk.Entry(
    search_tab,
    width=30
)

city_entry.pack(pady=5)

## кнопка поиск
button = tk.Button(
    search_tab,
    text="Найти",
    command=lambda: search_city()
)

button.pack(pady=10)

## список результатов
result_list = tk.Listbox(
    search_tab,
    width=80,
    height=20
)

result_list.pack(pady=10)

## вкладка информация

name_label = tk.Label(info_tab, text="")
city_info = tk.Label(info_tab, text="")
state_label = tk.Label(info_tab, text="")
zip_label = tk.Label(info_tab, text="")
lat_label = tk.Label(info_tab, text="")
lon_label = tk.Label(info_tab, text="")
rating_label = tk.Label(info_tab, text="")

name_label.pack(anchor="w", padx=20, pady=5)
city_info.pack(anchor="w", padx=20, pady=5)
state_label.pack(anchor="w", padx=20, pady=5)
zip_label.pack(anchor="w", padx=20, pady=5)
lat_label.pack(anchor="w", padx=20, pady=5)
lon_label.pack(anchor="w", padx=20, pady=5)
rating_label.pack(anchor="w", padx=20, pady=5)


## открытие подробной информации
def show_market(event):

    if not result_list.curselection():
        return

    index = result_list.curselection()[0]

    market = current_results[index]

    name_label.config(
        text=f"Название: {market.name}"
    )

    city_info.config(
        text=f"Город: {market.city}"
    )

    state_label.config(
        text=f"Штат: {market.state}"
    )

    zip_label.config(
        text=f"ZIP: {market.zip}"
    )

    lat_label.config(
        text=f"Широта: {market.lat}"
    )

    lon_label.config(
        text=f"Долгота: {market.lon}"
    )

    rating_label.config(
        text=f"Средний рейтинг: {get_average_rating(market):.1f}"
    )

    ## переключаемся на вкладку информации
    tabs.select(info_tab)


## поиск по городу
def search_city():

    global current_results

    city = city_entry.get()

    current_results = find_by_city(
        markets,
        city
    )

    result_list.delete(0, tk.END)

    for market in current_results:

        result_list.insert(
            tk.END,
            f"{market.name} | {market.city} | {market.state}"
        )


## двойной клик по рынку
result_list.bind(
    "<Double-Button-1>",
    show_market
)

## запускаем программу
root.mainloop()
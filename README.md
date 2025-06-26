Zignorujcie proszę te poniższe pliki/foldery co są w tym projekcie. Powinny być generowane lokalnie, u każdego osobno ale nie udało mi się ich nie dodać.

Jakby się to udało odpalić jakoś to w widok tabel -> Przywróć bazę danych uruchamia skrypt który wgrywa początkowe przykłądowe dane do bazy (backend/people/management/commands/initdata.py). 

 # Ignoruj różne warianty środowisk wirtualnych
venv/
VENV/
env/
ENV/
.venv/
.ENV/

# Ignoruj pliki i foldery tymczasowe Pythona
__pycache__/
*.py[cod]
*.pyo
*.pyd

# Ignoruj pliki systemowe i edytorów
.DS_Store
*.swp
*.swo
.vscode/
.idea/

# Ignoruj statyczne pliki generowane przez Django
backend/staticfiles/

Ponadto tak wygląda nasza baza danych rn: https://dbdiagram.io/d/6807b1411ca52373f5e90dd8


# Instrukcja uruchomienia projektu Django

## 1. Wymagania wstępne

- Python 3.12 (zalecana wersja zgodna z Twoim środowiskiem)
- SQL Server (np. SQL Server Express)
- pip (menedżer pakietów Pythona)
- W systemie Windows: Visual C++ Build Tools (do kompilacji niektórych zależności)

## 2. Klonowanie projektu

Wypakuj lub sklonuj projekt do wybranego katalogu, np.:

```
przykladowy_folder
```

## 3. Tworzenie i aktywacja wirtualnego środowiska

W terminalu PowerShell:

```powershell
cd "przykladowy_folder"
python -m venv venv
.\venv\Scripts\Activate.ps1
```

## 4. Instalacja zależności

W katalogu głównym projektu (tam gdzie jest `manage.py`):

```powershell
pip install -r requirements.txt
```

Jeśli nie masz pliku `requirements.txt`, zainstaluj ręcznie:

```powershell
pip install django mssql-django
```

## 5. Konfiguracja bazy danych SQL Server

1. Zainstaluj SQL Server (np. SQL Server Express) i uruchom serwer.
2. Zainstaluj sterownik ODBC dla SQL Server (np. ODBC Driver 17 for SQL Server).
3. Zaloguj się do SQL Server (np. przez sqlcmd lub SSMS) i utwórz bazę oraz użytkownika (np. `sa` z hasłem `abc`).

Przykład (w PowerShell, jeśli masz sqlcmd):

```powershell
sqlcmd -S localhost -U sa -P abc
```

W konsoli SQL Server utwórz bazę (np. moja_baza):

```sql
CREATE DATABASE moja_baza;
GO
```

4. W pliku `backend/backend/settings.py` znajdź sekcję `DATABASES` i ustaw:

```python
DATABASES = {
    'default': {
        'ENGINE': 'mssql',
        'NAME': 'moja_baza',
        'USER': 'sa',
        'PASSWORD': 'abc',
        'HOST': 'localhost',
        'PORT': '1433',
        'OPTIONS': {
            'driver': 'ODBC Driver 17 for SQL Server',
        },
    }
}
```

## 6. Migracje bazy danych

W katalogu `backend/` (tam gdzie jest `manage.py`):

```powershell
cd backend
python manage.py makemigrations
python manage.py migrate
```

## 7. Tworzenie konta administratora

```powershell
python manage.py createsuperuser
```

Postępuj zgodnie z instrukcjami w terminalu.

## 8. Uruchomienie serwera deweloperskiego

W katalogu `backend/`:

```powershell
python manage.py runserver
```

Aplikacja będzie dostępna pod adresem: http://127.0.0.1:8000/

## 9. Statyczne pliki (opcjonalnie)

Aby zebrać statyczne pliki do katalogu `staticfiles/`:

```powershell
python manage.py collectstatic
```

## 10. Dodatkowe uwagi

- Pliki frontendu (np. `people.js`) znajdują się w: `backend/people/static/people/people.js`
- Szablony HTML: `backend/people/templates/`
- Główne ustawienia Django: `backend/backend/settings.py`

---

W razie problemów sprawdź komunikaty błędów w terminalu lub pliku logów.

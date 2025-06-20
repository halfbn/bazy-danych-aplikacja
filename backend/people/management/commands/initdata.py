from django.core.management.base import BaseCommand
from people.models import Users, AccessGroups, Rooms, RoomAccess, UserAccess, Reservations
from django.db import connection
from datetime import date, time, timedelta
import random

class Command(BaseCommand):
    """
    PUNKT KONTROLNY: Stan tabel po uruchomieniu tego skryptu jest zgodny z wymaganiami.

    Jak odtworzyć ten stan:
    1. W katalogu django+baza/backend uruchom:
       python manage.py flush --noinput
       python manage.py initdata

    To wyczyści bazę i wypełni ją przykładowymi danymi.
    """
    help = 'Inicjalizuje przykładowe dane do wszystkich tabel.'

    def handle(self, *args, **kwargs):
        # Usuń wszystkie dane
        Reservations.objects.all().delete()
        RoomAccess.objects.all().delete()
        UserAccess.objects.all().delete()
        Rooms.objects.all().delete()
        AccessGroups.objects.all().delete()
        Users.objects.all().delete()

        # Resetuj licznik IDENTITY dla SQL Server
        with connection.cursor() as cursor:
            if connection.vendor == 'microsoft':
                for table in ['people_users', 'people_accessgroups', 'people_rooms', 'people_roomaccess', 'people_useraccess', 'people_reservations']:
                    cursor.execute(f"DBCC CHECKIDENT ('{table}', RESEED, 0)")
            # Resetuj sekwencje autoincrement (dla SQLite, PostgreSQL, MySQL)
            elif connection.vendor == 'sqlite':
                for table in ['people_users', 'people_accessgroups', 'people_rooms', 'people_roomaccess', 'people_useraccess', 'people_reservations']:
                    cursor.execute(f"DELETE FROM sqlite_sequence WHERE name='{table}'")
            elif connection.vendor == 'postgresql':
                for table in ['people_users', 'people_accessgroups', 'people_rooms', 'people_roomaccess', 'people_useraccess', 'people_reservations']:
                    cursor.execute(f"ALTER SEQUENCE {table}_id_seq RESTART WITH 1")
            elif connection.vendor == 'mysql':
                for table in ['people_users', 'people_accessgroups', 'people_rooms', 'people_roomaccess', 'people_useraccess', 'people_reservations']:
                    cursor.execute(f"ALTER TABLE {table} AUTO_INCREMENT = 1")

        # Użytkownicy
        users = []
        users.append(Users.objects.create(Name='Jan', Surname='Kowalski'))
        users.append(Users.objects.create(Name='Anna', Surname='Nowak'))
        users.append(Users.objects.create(Name='Piotr', Surname='Wiśniewski'))

        # Grupy dostępu
        group1 = AccessGroups.objects.create(GroupName='Admin')
        group2 = AccessGroups.objects.create(GroupName='Pracownik')
        group3 = AccessGroups.objects.create(GroupName='Gość')
        groups = [group1, group2, group3]

        # Przypisanie użytkowników do grup (każdy do jednej, jeden do dwóch)
        UserAccess.objects.create(UserID=users[0], AccessGroupID=group1)
        UserAccess.objects.create(UserID=users[1], AccessGroupID=group2)
        UserAccess.objects.create(UserID=users[2], AccessGroupID=group3)
        UserAccess.objects.create(UserID=users[0], AccessGroupID=group2)  # Jan w dwóch grupach

        # Pokoje
        rooms = []
        for i in range(200, 210):
            rooms.append(Rooms.objects.create(RoomID=i, Availability=1))

        # Przypisanie pokoi do grup (każdy pokój do jednej grupy)
        for idx, room in enumerate(rooms):
            RoomAccess.objects.create(RoomID=room, AccessGroupID=groups[idx % 3])

        # Przykładowe rezerwacje (każdy użytkownik rezerwuje inny pokój)
        today = date.today()
        Reservations.objects.create(
            UserID=users[0],
            RoomID=rooms[0],
            ReservationDate=today,
            ReservationHour=time(9, 0),
            ExitHour=time(11, 0)
        )
        Reservations.objects.create(
            UserID=users[1],
            RoomID=rooms[1],
            ReservationDate=today + timedelta(days=1),
            ReservationHour=time(12, 0),
            ExitHour=time(14, 0)
        )
        Reservations.objects.create(
            UserID=users[2],
            RoomID=rooms[2],
            ReservationDate=today + timedelta(days=2),
            ReservationHour=time(15, 0),
            ExitHour=time(17, 0)
        )

        # Dodatkowe rezerwacje losowe
        for i in range(3, 6):
            user = random.choice(users)
            room = random.choice(rooms)
            Reservations.objects.create(
                UserID=user,
                RoomID=room,
                ReservationDate=today + timedelta(days=i),
                ReservationHour=time(8 + i, 0),
                ExitHour=time(10 + i, 0)
            )

        self.stdout.write(self.style.SUCCESS('Baza została zainicjowana przykładowymi danymi.'))

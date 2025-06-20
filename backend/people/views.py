from django.http import JsonResponse
from django.shortcuts import render
from .models import Users, AccessGroups, Rooms, RoomAccess, UserAccess, Reservations

from django.views.decorators.csrf import csrf_exempt
from django.db import connection
from django.apps import apps
from .management.commands.initdata import Command as InitDataCommand
import json

def people_page(request):
    return render(request, 'people.html')

def login_page(request):
    return render(request, 'login.html')

def all_data(request):
    users = list(Users.objects.values())
    access = list(AccessGroups.objects.values())
    rooms = list(Rooms.objects.values())
    reservations = list(Reservations.objects.values())
    return JsonResponse({
        'users': users,
        'access': access,
        'rooms': rooms,
        'reservations': reservations
    }, safe=False, json_dumps_params={'ensure_ascii': False, 'default': str})


# API: Dodaj użytkownika (POST)
@csrf_exempt
def add_user(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        name = data.get('name')
        surname = data.get('surname')
        access_group_id = data.get('access_group_id')
        if not (name and surname and access_group_id):
            return JsonResponse({'success': False, 'error': 'Brak wymaganych danych'}, status=400)
        user = Users.objects.create(Name=name, Surname=surname)
        # Przypisz usera tylko do istniejącej grupy, bez tworzenia nowej
        try:
            access_group = AccessGroups.objects.get(AccessGroupID=access_group_id)
        except AccessGroups.DoesNotExist:
            user.delete()  # Usuwamy utworzonego usera, bo nie ma grupy
            return JsonResponse({'success': False, 'error': 'Wybrana grupa nie istnieje'}, status=400)
        UserAccess.objects.create(UserID=user, AccessGroupID=access_group)
        return JsonResponse({'success': True, 'user_id': user.UserID, 'access_group_id': access_group.AccessGroupID})
    return JsonResponse({'success': False, 'error': 'Tylko POST'}, status=405)

# API: Usuń użytkownika (POST)
@csrf_exempt
def delete_user(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        user_id = data.get('user_id')
        try:
            user = Users.objects.get(UserID=user_id)
        except Users.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Nie znaleziono użytkownika'}, status=404)
        # Usuwamy access powiązany z tym userem
        UserAccess.objects.filter(UserID=user).delete()
        user.delete()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Tylko POST'}, status=405)

# API: Lista użytkowników z grupą dostępu
def users_with_access(request):
    users = Users.objects.all()
    result = []
    for user in users:
        accesses = UserAccess.objects.filter(UserID=user)
        group_list = []
        for access in accesses:
            if access.AccessGroupID:
                group_list.append({
                    'AccessGroupID': access.AccessGroupID.AccessGroupID,
                    'AccessGroupName': access.AccessGroupID.GroupName
                })
        result.append({
            'UserID': user.UserID,
            'Name': user.Name,
            'Surname': user.Surname,
            'Groups': group_list
        })
    # Dla formularza: lista wszystkich unikalnych grup (id i nazwa)
    all_groups = list(AccessGroups.objects.values('AccessGroupID', 'GroupName'))
    return JsonResponse({'users': result, 'groups': all_groups}, safe=False)

def db_tables(request):
    # Pobierz wszystkie modele z aplikacji people
    models = [Users, AccessGroups, Rooms, RoomAccess, UserAccess, Reservations]
    tables = []
    for model in models:
        name = model._meta.db_table
        columns = [f.name for f in model._meta.fields]
        rows = []
        for obj in model.objects.all():
            row = {}
            for field in model._meta.fields:
                value = getattr(obj, field.name)
                # Jeśli to klucz obcy, pokaż ID i czytelną nazwę
                if field.is_relation and value is not None:
                    if hasattr(value, 'pk'):
                        row[field.name] = f"{value.pk} ({str(value)})"
                    else:
                        row[field.name] = str(value)
                else:
                    row[field.name] = value
            rows.append(row)
        tables.append({
            'name': name,
            'columns': columns,
            'rows': rows
        })
    return JsonResponse({'tables': tables})

@csrf_exempt
def db_restore(request):
    if request.method == 'POST':
        try:
            cmd = InitDataCommand()
            cmd.handle()
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Tylko POST'}, status=405)

@csrf_exempt
def change_user_access(request):
    print("change_user_access called")  # DEBUG
    if request.method == 'POST':
        data = json.loads(request.body)
        user_id = data.get('user_id')
        access_group_ids = data.get('access_group_ids')
        if not (user_id and access_group_ids and isinstance(access_group_ids, list) and len(access_group_ids) > 0):
            return JsonResponse({'success': False, 'error': 'Wybierz co najmniej jedną grupę!'}, status=400)
        try:
            user = Users.objects.get(UserID=user_id)
        except Users.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Nie znaleziono użytkownika'}, status=404)
        # Usuwamy wszystkie stare powiązania
        UserAccess.objects.filter(UserID=user).delete()
        # Dodajemy nowe powiązania
        for group_id in access_group_ids:
            try:
                group = AccessGroups.objects.get(AccessGroupID=group_id)
                UserAccess.objects.create(UserID=user, AccessGroupID=group)
            except AccessGroups.DoesNotExist:
                continue
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Tylko POST'}, status=405)

def user_rooms(request, user_id):
    try:
        user = Users.objects.get(UserID=user_id)
    except Users.DoesNotExist:
        return JsonResponse({'rooms': [], 'error': 'Nie znaleziono użytkownika'}, status=404)
    # Znajdź wszystkie grupy dostępu użytkownika
    accesses = UserAccess.objects.filter(UserID=user)
    groups = [a.AccessGroupID for a in accesses if a.AccessGroupID]
    if not groups:
        return JsonResponse({'rooms': []})
    # Pokoje dostępne dla wszystkich grup użytkownika
    rooms = []
    seen_room_ids = set()
    for group in groups:
        room_access = RoomAccess.objects.filter(AccessGroupID=group)
        for ra in room_access:
            room = ra.RoomID
            if room.RoomID in seen_room_ids:
                continue
            seen_room_ids.add(room.RoomID)
            status = 'dostępny' if room.Availability == 1 else 'zajęty'
            rooms.append({
                'RoomID': room.RoomID,
                'GroupName': group.GroupName,
                'Status': status
            })
    return JsonResponse({'rooms': rooms})

def group_rooms(request, group_id):
    try:
        group = AccessGroups.objects.get(AccessGroupID=group_id)
    except AccessGroups.DoesNotExist:
        return JsonResponse({'rooms': [], 'error': 'Nie znaleziono grupy'}, status=404)
    room_access = RoomAccess.objects.filter(AccessGroupID=group)
    rooms = []
    for ra in room_access:
        room = ra.RoomID
        status = 'dostępny' if room.Availability == 1 else 'zajęty'
        rooms.append({
            'RoomID': room.RoomID,
            'Status': status
        })
    return JsonResponse({'rooms': rooms})

def all_rooms(request):
    rooms = Rooms.objects.all()
    result = []
    for room in rooms:
        status = 'dostępny' if room.Availability == 1 else 'zajęty'
        result.append({
            'RoomID': room.RoomID,
            'Status': status
        })
    return JsonResponse({'rooms': result})

@csrf_exempt
def toggle_room_availability(request, room_id):
    try:
        room = Rooms.objects.get(RoomID=room_id)
    except Rooms.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Nie znaleziono pokoju'}, status=404)
    # Zmień dostępność
    room.Availability = 0 if room.Availability == 1 else 1
    room.save()
    return JsonResponse({'success': True, 'new_status': 'dostępny' if room.Availability == 1 else 'zajęty'})

@csrf_exempt
def change_room_groups(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        room_id = data.get('room_id')
        access_group_ids = data.get('access_group_ids')
        if not (room_id and access_group_ids and isinstance(access_group_ids, list) and len(access_group_ids) > 0):
            return JsonResponse({'success': False, 'error': 'Wybierz co najmniej jedną grupę!'}, status=400)
        try:
            room = Rooms.objects.get(RoomID=room_id)
        except Rooms.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Nie znaleziono pokoju'}, status=404)
        # Usuń stare powiązania
        RoomAccess.objects.filter(RoomID=room).delete()
        # Dodaj nowe powiązania
        for group_id in access_group_ids:
            try:
                group = AccessGroups.objects.get(AccessGroupID=group_id)
                RoomAccess.objects.create(RoomID=room, AccessGroupID=group)
            except AccessGroups.DoesNotExist:
                continue
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Tylko POST'}, status=405)

def rooms_with_access(request):
    rooms = Rooms.objects.all()
    result = []
    for room in rooms:
        status = 'dostępny' if room.Availability == 1 else 'zajęty'
        # Pobierz wszystkie grupy dostępu dla pokoju
        accesses = RoomAccess.objects.filter(RoomID=room)
        group_list = []
        for access in accesses:
            if access.AccessGroupID:
                group_list.append({
                    'AccessGroupID': access.AccessGroupID.AccessGroupID,
                    'AccessGroupName': access.AccessGroupID.GroupName
                })
        result.append({
            'RoomID': room.RoomID,
            'Status': status,
            'Groups': group_list
        })
    all_groups = list(AccessGroups.objects.values('AccessGroupID', 'GroupName'))
    return JsonResponse({'rooms': result, 'groups': all_groups}, safe=False)

@csrf_exempt
def add_reservation(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        user_id = data.get('user_id')
        room_id = data.get('room_id')
        date = data.get('date')
        start_hour = data.get('start_hour')
        end_hour = data.get('end_hour')
        if not (user_id and room_id and date and start_hour and end_hour):
            return JsonResponse({'success': False, 'error': 'Wszystkie pola są wymagane!'}, status=400)
        try:
            user = Users.objects.get(UserID=user_id)
            room = Rooms.objects.get(RoomID=room_id)
        except (Users.DoesNotExist, Rooms.DoesNotExist):
            return JsonResponse({'success': False, 'error': 'Nie znaleziono użytkownika lub pokoju'}, status=404)
        # Sprawdź czy użytkownik ma dostęp do pokoju
        user_groups = UserAccess.objects.filter(UserID=user).values_list('AccessGroupID', flat=True)
        room_groups = RoomAccess.objects.filter(RoomID=room).values_list('AccessGroupID', flat=True)
        if not set(user_groups).intersection(room_groups):
            return JsonResponse({'success': False, 'error': 'Użytkownik nie ma dostępu do tego pokoju!'}, status=403)
        # Sprawdź czy nie ma kolizji rezerwacji
        from datetime import datetime
        try:
            start = datetime.strptime(start_hour, '%H:%M').time()
            end = datetime.strptime(end_hour, '%H:%M').time()
        except Exception:
            return JsonResponse({'success': False, 'error': 'Nieprawidłowy format godziny!'}, status=400)
        if start >= end:
            return JsonResponse({'success': False, 'error': 'Godzina zakończenia musi być po rozpoczęciu!'}, status=400)
        overlapping = Reservations.objects.filter(RoomID=room, ReservationDate=date).filter(
            ReservationHour__lt=end, ExitHour__gt=start
        )
        if overlapping.exists():
            return JsonResponse({'success': False, 'error': 'Pokój jest już zarezerwowany w tym czasie!'}, status=409)
        Reservations.objects.create(UserID=user, RoomID=room, ReservationDate=date, ReservationHour=start, ExitHour=end)
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Tylko POST'}, status=405)

@csrf_exempt
def delete_reservation(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        reservation_id = data.get('reservation_id')
        if not reservation_id:
            return JsonResponse({'success': False, 'error': 'Podaj ID rezerwacji!'}, status=400)
        try:
            reservation = Reservations.objects.get(ReservationID=reservation_id)
            reservation.delete()
            return JsonResponse({'success': True})
        except Reservations.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Nie znaleziono rezerwacji!'}, status=404)
    return JsonResponse({'success': False, 'error': 'Tylko POST'}, status=405)

def reservations_list(request):
    reservations = Reservations.objects.select_related('UserID', 'RoomID').all().order_by('-ReservationDate', '-ReservationHour')
    result = []
    for r in reservations:
        result.append({
            'ReservationID': r.ReservationID,
            'UserID': r.UserID.UserID,
            'UserName': f"{r.UserID.Name} {r.UserID.Surname}",
            'RoomID': r.RoomID.RoomID,
            'Date': r.ReservationDate,
            'StartHour': r.ReservationHour,
            'EndHour': r.ExitHour
        })
    return JsonResponse({'reservations': result}, safe=False)

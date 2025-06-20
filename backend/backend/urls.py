"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path

from people.views import people_page, all_data, login_page, add_user, delete_user, users_with_access, change_user_access, user_rooms, group_rooms, all_rooms, toggle_room_availability, db_tables, db_restore, change_room_groups, rooms_with_access, add_reservation, delete_reservation, reservations_list

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/all/', all_data, name='all_data'),
    path('api/users/add/', add_user, name='add_user'),
    path('api/users/delete/', delete_user, name='delete_user'),
    path('api/users/list/', users_with_access, name='users_with_access'),
    path('api/users/change_access/', change_user_access, name='change_user_access'),
    path('api/rooms/user/<int:user_id>/', user_rooms, name='user_rooms'),
    path('api/rooms/group/<int:group_id>/', group_rooms, name='group_rooms'),
    path('api/rooms/all/', all_rooms, name='all_rooms'),
    path('api/rooms/toggle/<int:room_id>/', toggle_room_availability, name='toggle_room_availability'),
    path('login/', login_page, name='login_page'),
    path('', people_page, name='people_page'),
    path('api/db/tables/', db_tables, name='db_tables'),
    path('api/db/restore/', db_restore, name='db_restore'),
    path('api/rooms/change_groups/', change_room_groups, name='change_room_groups'),
    path('api/rooms/list/', rooms_with_access, name='rooms_with_access'),
    path('api/reservations/add/', add_reservation, name='add_reservation'),
    path('api/reservations/delete/', delete_reservation, name='delete_reservation'),
    path('api/reservations/list/', reservations_list, name='reservations_list'),
]

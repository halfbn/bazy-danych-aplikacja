from django.contrib import admin

from .models import Users, AccessGroups, Rooms, RoomAccess, UserAccess, Reservations
admin.site.register(Users)
admin.site.register(AccessGroups)
admin.site.register(Rooms)
admin.site.register(RoomAccess)
admin.site.register(UserAccess)
admin.site.register(Reservations)

from django.contrib import admin

# Register your models here.
# No models for now
# Eventually we can create a database for the big events
from twython_django.models import TwitterProfile,Annotation,MovieAnnotation

# class AnnotationAdmin(admin.ModelAdmin):
#     search_fields = ('movie')
#     list_display = ('movie','user_name','annotation','votes',)
#     list_display_links = ('movie',)
#     list_editable = ('votes',)

#     # define a really fancy callback to get the username
#     def user_name(self, obj):
#         return '%s'%(obj.user.user.username)
#     user_name.short_description = 'username'

admin.site.register(TwitterProfile)
admin.site.register(Annotation)
admin.site.register(MovieAnnotation)
# admin.site.register(MovieAnnotation,AnnotationAdmin)


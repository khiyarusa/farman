import io
p='README.md'
s=io.open(p,encoding='utf-8').read()
s=s.replace('screenshots/03-garage.png','screenshots/02-garage.png')
s=s.replace('screenshots/05-city-drive.png','screenshots/07-driving-manual.png')
s=s.replace('screenshots/08-mountain.png','screenshots/09-mountain.png')
s=s.replace('screenshots/12-settings.png','screenshots/05-settings.png')
s=s.replace('Garage — car selection, technical specifications, paint and rims.','Garage — car selection, specifications, service, paint and rims.')
s=s.replace('City drive — free drive from the city spawn.','City drive — manual gearbox HUD while driving the city street.')
io.open(p,'w',encoding='utf-8',newline='').write(s)
print('readme screenshot paths fixed')

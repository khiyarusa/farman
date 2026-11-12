import io, os
p='android/app/src/main/res/values/colors.xml'
io.open(p,'w',encoding='utf-8',newline='').write(
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
    '    <color name="colorPrimary">#0B0F11</color>\n'
    '    <color name="colorPrimaryDark">#080A0B</color>\n'
    '    <color name="colorAccent">#2EA37F</color>\n'
    '</resources>\n')
print('colors fixed')

RegisterNetEvent('np-quickmenu:server:disconnect', function()
    local src = source
    DropPlayer(src, 'Te-ai deconectat de pe server.')
end)

RegisterNetEvent('np-quickmenu:server:exit', function()
    local src = source
    DropPlayer(src, 'Ai parasit jocul.')
end)
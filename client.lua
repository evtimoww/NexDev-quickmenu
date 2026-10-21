local isMenuOpen = false
local isFrontendActive = false

-- Stored runtime settings table
local currentSettings = {
    radar_display = 'ON',
    hud_display = 'ON',
    subtitles = 'ON',
    measurement_system = 'METRIC',
    voice_chat = 'ON',
    gps_route = 'ON',
    auto_save = 'ON',
    sfx_vol = '100%',
    music_vol = '60%',
    radio_station = 'OFF',
    audio_output = 'STEREO HEADPHONES',
    mute_focus_loss = 'OFF',
    brightness = '50%',
    safezone_size = '100%',
    weapon_target = 'COMPLEX',
    reticle_size = 'NORMAL',
    gps_route_display = 'ON',
    directx_version = 'DIRECTX 11',
    screen_type = 'WINDOWED BORDERLESS',
    resolution = '1920X1080',
    aspect_ratio = 'AUTO',
    refresh_rate = '144 HZ',
    output_monitor = '1',
    fxaa = 'ON',
    msaa = 'OFF',
    txaa = 'OFF',
    vsync = 'OFF',
    pause_on_focus_loss = 'OFF',
    texture_quality = 'VERY HIGH',
    shader_quality = 'VERY HIGH',
    shadow_quality = 'HIGH',
    reflection_quality = 'VERY HIGH',
    reflection_msaa = 'OFF',
    water_quality = 'VERY HIGH',
    particles_quality = 'VERY HIGH',
    grass_quality = 'VERY HIGH',
    soft_shadows = 'SOFTER',
    post_fx = 'VERY HIGH',
    anisotropic_filtering = 'X16',
    ambient_occlusion = 'HIGH',
    tessellation = 'VERY HIGH',
    voice_output_device = 'DEFAULT',
    voice_volume = '100%',
    mic_enabled = 'ON',
    mic_input_device = 'DEFAULT MICROPHONE',
    voice_mode = 'PUSH TO TALK',
    mic_volume = '100%',
    mic_sensitivity = '80%',
    mouse_input = 'RAW INPUT',
    invert_mouse_look = 'OFF',
    mouse_look_sens = '5',
    mouse_aim_sens = '5',
    invert_mouse_fly = 'OFF',
    mouse_fly_sens = '5',
    invert_mouse_sub = 'OFF'
}

local function removeBlur()
    TriggerScreenblurFadeOut(100)
    DisableScreenblurFade()
end

-- Apply setting live to GTA V / FiveM runtime
local function ApplySetting(key, val)
    if not key or not val then return end
    currentSettings[key] = val
    SetResourceKvp('qbx_setting_' .. tostring(key), tostring(val))

    -- 1. GAME SETTINGS
    if key == 'radar_display' then
        DisplayRadar(val == 'ON')
    elseif key == 'hud_display' then
        DisplayHud(val == 'ON')
    elseif key == 'measurement_system' then
        TriggerEvent('qbx:client:setMeasurement', val)
    elseif key == 'gps_route' then
        if val == 'OFF' then
            ClearGpsPlayerWaypoint()
        end

    -- 2. AUDIO SETTINGS
    elseif key == 'sfx_vol' then
        local percent = tonumber(string.match(val, '(%d+)')) or 100
        if val == 'OFF' then percent = 0 end
        SendNUIMessage({
            action = 'set_sfx_volume',
            volume = percent / 100.0
        })
    elseif key == 'music_vol' then
        if val == 'OFF' then
            SetFrontendRadioActive(false)
            SetAudioFlag('DisableFlightMusic', true)
            SetAudioFlag('PoliceScannerDisabled', true)
        else
            SetFrontendRadioActive(true)
            SetAudioFlag('DisableFlightMusic', false)
        end
    elseif key == 'radio_station' then
        local ped = PlayerPedId()
        local veh = GetVehiclePedIsIn(ped, false)
        if val == 'OFF' then
            SetUserRadioControlEnabled(false)
            SetFrontendRadioActive(false)
            SetRadioToStationName('OFF')
            if veh ~= 0 then
                SetVehRadioStation(veh, 'OFF')
            end
        else
            SetUserRadioControlEnabled(true)
            SetFrontendRadioActive(true)
            local stationMap = {
                ['RADIO LOS SANTOS'] = 'RADIO_01_CLASS_ROCK',
                ['WEST COAST CLASSICS'] = 'RADIO_02_POP',
                ['NON-STOP-POP FM'] = 'RADIO_03_HIPHOP_NEW',
                ['LOS SANTOS ROCK RADIO'] = 'RADIO_04_PUNK',
                ['FLYLO FM'] = 'RADIO_07_DANCE_01',
                ['THE BLUE ARK'] = 'RADIO_12_REGGAE'
            }
            local st = stationMap[val] or 'RADIO_01_CLASS_ROCK'
            SetRadioToStationName(st)
            if veh ~= 0 then
                SetVehRadioStation(veh, st)
            end
        end
    elseif key == 'mute_focus_loss' then
        SetAudioFlag('MuteAudioWhenFocusedOff', val == 'ON')

    -- 3. DISPLAY SETTINGS
    elseif key == 'safezone_size' then
        -- Safezone size preference saved to KVP
    elseif key == 'brightness' then
        local p = tonumber(string.match(val, '(%d+)')) or 50
        local factor = p / 50.0
        SetTimecycleModifierStrength(factor)

    -- 4. VOICE CHAT (pma-voice & Mumble integration)
    elseif key == 'voice_chat' then
        if val == 'OFF' then
            pcall(function() MumbleSetActive(false) end)
        else
            pcall(function() MumbleSetActive(true) end)
        end
    elseif key == 'voice_volume' then
        local p = tonumber(string.match(val, '(%d+)')) or 100
        if val == 'OFF' then p = 0 end
        pcall(function()
            MumbleSetOutputVolume(p / 100.0)
        end)
        if GetResourceState('pma-voice') == 'started' then
            pcall(function()
                exports['pma-voice']:setRadioVolume(p)
                exports['pma-voice']:setCallVolume(p)
            end)
        end
    elseif key == 'mic_enabled' then
        if val == 'OFF' then
            pcall(function() MumbleSetAudioInputDistance(0.0) end)
        else
            pcall(function() MumbleSetAudioInputDistance(15.0) end)
        end
        if GetResourceState('pma-voice') == 'started' then
            pcall(function()
                exports['pma-voice']:setVoiceProperty('micClicks', val == 'ON')
            end)
        end
    end
end

-- Load all stored settings from KVP
local function LoadAllSettings()
    for k, defaultVal in pairs(currentSettings) do
        local saved = GetResourceKvpString('qbx_setting_' .. k)
        if saved and saved ~= '' then
            currentSettings[k] = saved
        end
    end

    -- Apply initial loaded states
    DisplayRadar(currentSettings.radar_display == 'ON')
    DisplayHud(currentSettings.hud_display == 'ON')
end

-- Initialize on script load
CreateThread(function()
    Wait(500)
    LoadAllSettings()
end)

-- Look & aim sensitivity / mouse inversion runtime thread
CreateThread(function()
    while true do
        Wait(0)
        if currentSettings.invert_mouse_look == 'ON' then
            local y = GetControlNormal(0, 2) -- Camera Look UD
            if y ~= 0 then
                SetControlNormal(0, 2, -y)
            end
        end
    end
end)

local function openQuickMenu()
    if isMenuOpen or isFrontendActive then return end
    isMenuOpen = true
    TriggerScreenblurFadeIn(150)
    SetNuiFocus(true, true)
    local rx, ry = GetActiveScreenResolution()
    SendNUIMessage({
        action = 'open',
        resX = rx,
        resY = ry,
        settings = currentSettings
    })
end

local function closeQuickMenu()
    isMenuOpen = false
    SetNuiFocus(false, false)
    removeBlur()
    SendNUIMessage({
        action = 'close'
    })
end

-- Key interception loop
CreateThread(function()
    while true do
        Wait(0)
        if not isFrontendActive then
            DisableControlAction(0, 200, true) -- ESC
            DisableControlAction(0, 199, true) -- P

            if IsDisabledControlJustPressed(0, 200) or IsDisabledControlJustPressed(0, 199) then
                if not isMenuOpen then
                    openQuickMenu()
                else
                    closeQuickMenu()
                end
            end
        else
            if not IsPauseMenuActive() then
                Wait(250)
                isFrontendActive = false
                removeBlur()
            end
        end
    end
end)

RegisterNUICallback('close', function(_, cb)
    cb('ok')
    closeQuickMenu()
end)

RegisterNUICallback('save_setting', function(data, cb)
    cb('ok')
    local key = data and data.key
    local val = data and data.value

    if key and val then
        ApplySetting(key, val)
    end
end)

RegisterNUICallback('apply_all_settings', function(data, cb)
    cb('ok')
    local settings = data and data.settings
    if settings then
        for k, v in pairs(settings) do
            ApplySetting(k, v)
        end
    end
    if exports['karma-notify'] then
        exports['karma-notify']:Notify('Setarile au fost aplicate cu succes!', 'success', 3500)
    else
        TriggerEvent('chat:addMessage', { args = { '^2[SETTINGS]', 'Setarile au fost aplicate cu succes!' } })
    end
end)

RegisterNUICallback('action', function(data, cb)
    cb('ok')
    local action = data and data.action or 'resume'
    closeQuickMenu()

    if action == 'resume' then
        removeBlur()
    elseif action == 'disconnect' then
        removeBlur()
        Wait(60)
        TriggerServerEvent('np-quickmenu:server:disconnect')
    elseif action == 'map' then
        CreateThread(function()
            removeBlur()
            isFrontendActive = true
            Wait(60)
            SetFrontendActive(true)
        end)
    elseif action == 'achievements' then
        removeBlur()
        if exports['karma-notify'] then
            exports['karma-notify']:Notify('Realizarile si statisticile sunt active', 'inform', 4000)
        else
            TriggerEvent('chat:addMessage', { args = { '^4[STATS]', 'Statistici server active.' } })
        end
    elseif action == 'hub' then
        removeBlur()
        if exports['karma-notify'] then
            exports['karma-notify']:Notify('HUB Server Qbox', 'inform', 4000)
        else
            TriggerEvent('chat:addMessage', { args = { '^4[HUB]', 'Bine ai venit pe serverul Qbox!' } })
        end
    elseif action == 'legal' then
        removeBlur()
        if exports['karma-notify'] then
            exports['karma-notify']:Notify('Regulamentul si informatiile se gasesc pe Discord', 'inform', 5000)
        else
            TriggerEvent('chat:addMessage', { args = { '^3[LEGAL]', 'Regulamentul este pe Discord.' } })
        end
    elseif action == 'exit' then
        removeBlur()
        Wait(60)
        TriggerServerEvent('np-quickmenu:server:exit')
    end
end)

RegisterCommand('fixblur', function()
    removeBlur()
    closeQuickMenu()
end, false)

RegisterCommand('quickmenu', function()
    if not isMenuOpen then
        openQuickMenu()
    else
        closeQuickMenu()
    end
end, false)
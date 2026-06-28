import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, MessageSquare, AlertTriangle, Loader2, Users, User, Search, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { QRCodeSVG } from 'qrcode.react';
import { Input } from '@/components/ui/input';
import { useWhatsAppBot } from '@/hooks/use-whatsapp-bot';
import { useSettings } from '@/hooks/use-settings';
import { Switch } from '@/components/ui/switch';

export function SyncWhatsApp() {
  const { settings, saveSettings } = useSettings();
  const [localUrl, setLocalUrl] = useState('http://localhost:3001');
  const bot = useWhatsAppBot(settings?.whatsapp_local_url || 'http://localhost:3001');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLimitAlert, setShowLimitAlert] = useState(false);

  useEffect(() => {
    if (settings?.whatsapp_local_url) {
      setLocalUrl(settings.whatsapp_local_url);
    }
  }, [settings?.whatsapp_local_url]);

  const handleToggleGroup = async (groupId: string) => {
    if (!settings) return;
    const currentIds = settings.whatsapp_default_chat_ids || [];
    let newIds;
    
    if (currentIds.includes(groupId)) {
      newIds = currentIds.filter(id => id !== groupId);
    } else {
      if (currentIds.length >= 5) {
        setShowLimitAlert(true);
        return;
      }
      newIds = [...currentIds, groupId];
    }
    await saveSettings({ whatsapp_default_chat_ids: newIds });
  };

  return (
    <Card className="border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent rounded-2xl overflow-hidden">
      <CardHeader className="pb-4 border-b border-emerald-500/10 bg-gradient-to-r from-emerald-500/10 to-transparent">
        <div className="flex items-center justify-between w-full">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <div className="p-1.5 bg-emerald-500/20 rounded-lg">
              <MessageSquare className="h-4 w-4" />
            </div>
            Bot de WhatsApp
          </CardTitle>
          
          <div className="flex items-center gap-3">
            {bot.isAvailable && settings?.show_whatsapp_bot && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                bot.status.isReady 
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              }`}>
                <div className={`h-1.5 w-1.5 rounded-full ${
                  bot.status.isReady ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`} />
                {bot.status.isReady ? 'Conectado' : 'Pendiente'}
              </div>
            )}
            <Switch
              checked={!!settings?.show_whatsapp_bot}
              onCheckedChange={async (checked) => {
                await saveSettings({ show_whatsapp_bot: checked });
              }}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-5 space-y-4 relative">
        {settings?.show_whatsapp_bot ? (
          <>
            {bot.conflictBotUrl && (
          <div className="flex items-start gap-3 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 animate-pulse text-rose-500" />
            <div>
              <span className="font-bold">Conflicto de Bot Detectado:</span> Otro bot de WhatsApp diferente está conectado y activo en esta misma área de trabajo (Servidor: <code>{bot.conflictBotUrl}</code>). 
              <p className="mt-1 font-semibold text-[11px] text-rose-500/90">
                Tener múltiples bots con cuentas distintas en un mismo área causará fallas en el envío y desalineación de contactos.
              </p>
            </div>
          </div>
        )}

        {/* Configuración de URL */}
        <div className="space-y-2 pb-2 border-b border-dashed border-emerald-500/10">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            URL del Bot de WhatsApp
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="http://localhost:3001"
              value={localUrl}
              onChange={(e) => setLocalUrl(e.target.value)}
              className="bg-background/50 focus-visible:ring-emerald-500/30 border-muted/40 h-8 text-sm"
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={async () => {
                await saveSettings({ whatsapp_local_url: localUrl });
              }}
              className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 h-8"
            >
              Conectar
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Usa <code>http://localhost:3001</code> si corre en esta máquina, o la IP (ej: <code>http://192.168.1.50:3001</code>) si corre en otra.
          </p>
        </div>

        {bot.isLoading ? (
          <div className="flex flex-col items-center justify-center py-6 text-sm text-muted-foreground gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            <span>Verificando estado del bot local...</span>
          </div>
        ) : !bot.isAvailable ? (
          <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground gap-3 px-4 text-center">
            <div className="p-3 bg-amber-500/10 rounded-full text-amber-500">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <span className="font-bold text-foreground">Servidor no disponible</span>
            <p className="text-xs text-muted-foreground max-w-[250px]">
              Asegúrate de que el bot de WhatsApp esté encendido y que la URL configurada sea correcta.
            </p>
          </div>
        ) : bot.status.isReady ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Grupos y Chats Destino
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => bot.loadChats()}
                    className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                  >
                    🔄 Recargar
                  </button>
                  <span className={`text-xs ${(settings?.whatsapp_default_chat_ids || []).length >= 5 ? 'text-amber-500 font-bold' : 'text-muted-foreground'}`}>
                    {(settings?.whatsapp_default_chat_ids || []).length}/5 seleccionados
                  </span>
                  {(settings?.whatsapp_default_chat_ids || []).length > 0 && (
                    <button
                      type="button"
                      onClick={async () => {
                        await saveSettings({ whatsapp_default_chat_ids: [] });
                      }}
                      className="text-[10px] text-destructive hover:underline font-bold uppercase tracking-wider transition-colors"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar grupo o contacto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-background/50 pl-9 focus-visible:ring-emerald-500/30 border-muted/40"
                />
              </div>
              
              <ScrollArea className="h-56 border rounded-xl bg-background/30 backdrop-blur-sm overflow-hidden">
                <div className="p-2 space-y-1">
                  <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Grupos</div>
                  {bot.chats.filter(c => c.isGroup && (c.name || '').toLowerCase().includes(searchQuery.toLowerCase())).map((chat) => {
                    const isChecked = (settings?.whatsapp_default_chat_ids || []).includes(chat.id);
                    return (
                      <div 
                        key={chat.id} 
                        className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${
                          isChecked ? 'bg-emerald-500/10' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleToggleGroup(chat.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${isChecked ? 'bg-emerald-500/20 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                            <Users className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium">{chat.name || chat.id}</span>
                        </div>
                        <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                          isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/30'
                        }`}>
                          {isChecked && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-3">Contactos</div>
                  {bot.chats.filter(c => !c.isGroup && (c.name || '').toLowerCase().includes(searchQuery.toLowerCase())).map((chat) => {
                    const isChecked = (settings?.whatsapp_default_chat_ids || []).includes(chat.id);
                    return (
                      <div 
                        key={chat.id} 
                        className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${
                          isChecked ? 'bg-emerald-500/10' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleToggleGroup(chat.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${isChecked ? 'bg-emerald-500/20 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                            <User className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium">{chat.name || chat.id}</span>
                        </div>
                        <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                          isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/30'
                        }`}>
                          {isChecked && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              
              <p className="text-[11px] text-muted-foreground mt-2 px-1">
                Los reportes se enviarán automáticamente a todos los chats seleccionados.
              </p>
            </div>
          </div>
        ) : bot.status.needsAuth ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 justify-center">
              <AlertTriangle className="h-4 w-4" /> Requiere Autenticación
            </div>
            
            {bot.status.qr ? (
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-emerald-500/30">
                  <QRCodeSVG value={bot.status.qr} size={180} />
                </div>
                <p className="text-xs text-muted-foreground text-center max-w-[250px]">
                  Escanea este código QR con la app de WhatsApp en tu teléfono para vincular la cuenta.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-2xl bg-background/50 text-sm text-muted-foreground gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                <span>Generando código QR...</span>
              </div>
            )}
            
            <Button size="sm" variant="outline" onClick={bot.checkStatus} className="w-full border-emerald-500/20 hover:bg-emerald-500/5 hover:text-emerald-600">
              Verificar estado
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            <span className="font-medium text-foreground">{bot.status.statusMessage || 'Iniciando cliente...'}</span>
            <p className="text-xs text-muted-foreground max-w-[250px] text-center">
              Esto puede tardar un momento mientras se sincronizan los datos.
            </p>
          </div>
        )}
        {showLimitAlert && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-50 animate-in fade-in">
            <div className="bg-card border rounded-2xl p-6 shadow-xl max-w-sm text-center space-y-4 border-amber-500/20">
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto text-amber-500">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg">Límite alcanzado</h3>
              <p className="text-sm text-muted-foreground">
                Por seguridad, el límite máximo es de 5 chats para evitar que WhatsApp bloquee tu cuenta.
              </p>
              <Button onClick={() => setShowLimitAlert(false)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                Entendido
              </Button>
            </div>
          </div>
        )}
          </>
        ) : (
          <div className="text-xs text-muted-foreground leading-relaxed py-2 font-medium">
            Activa esta opción para configurar el bot local de WhatsApp, escanear el código QR y seleccionar los destinatarios de los reportes. Una vez activo, se mostrará el panel rápido del bot en la barra de navegación para envío directo.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import React from 'react';
import { useScreenConfig } from './ScreenConfigProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Info } from 'lucide-react';
import { MAGICAL_EFFECTS, NORMAL_EFFECTS } from '../../../lib/composeEffects';

/**
 * Composant pour configurer les effets magiques et normaux d'un écran
 */
const FilterSettings = () => {
  const { config, updateEffect, saveScreenConfig } = useScreenConfig();

  if (!config) {
    return <div>Chargement de la configuration...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Configuration des effets
          <Badge variant="outline" className="ml-2">V11.2</Badge>
        </CardTitle>
        <CardDescription>
          Sélectionnez un effet magique et un effet normal pour cet écran.
          <div className="flex items-center gap-1 mt-1 text-amber-600">
            <Info size={14} />
            <span className="text-xs">Un seul effet par catégorie peut être actif à la fois.</span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="magical" className="w-full">
          <TabsList>
            <TabsTrigger value="magical">Effets magiques</TabsTrigger>
            <TabsTrigger value="normal">Effets normaux</TabsTrigger>
          </TabsList>

          <TabsContent value="magical" className="space-y-4 pt-4">
            <div className="text-sm text-muted-foreground mb-2">
              Les effets magiques transforment complètement l'apparence des photos avec l'IA.
            </div>
            <RadioGroup
              value={config.magicalEffect ?? ''}
              onValueChange={id => updateEffect('magical', id)}
            >
              {MAGICAL_EFFECTS.map(e => (
                <div key={e.id} className="flex items-start space-x-2 p-2 rounded-md hover:bg-accent">
                  <RadioGroupItem value={e.id} id={`magical-${e.id}`} />
                  <div className="grid gap-1.5">
                    <Label htmlFor={`magical-${e.id}`} className="font-medium">
                      {e.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">{e.description}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-start space-x-2 p-2 rounded-md hover:bg-accent">
                <RadioGroupItem value="" id="magical-none" />
                <div className="grid gap-1.5">
                  <Label htmlFor="magical-none" className="font-medium">
                    Aucun
                  </Label>
                  <p className="text-sm text-muted-foreground">Désactiver les effets magiques</p>
                </div>
              </div>
            </RadioGroup>
          </TabsContent>

          <TabsContent value="normal" className="space-y-4 pt-4">
            <div className="text-sm text-muted-foreground mb-2">
              Les effets normaux sont des filtres basiques appliqués après les effets magiques.
            </div>
            <RadioGroup
              value={config.normalEffect ?? ''}
              onValueChange={id => updateEffect('normal', id)}
            >
              {NORMAL_EFFECTS.map(e => (
                <div key={e.id} className="flex items-start space-x-2 p-2 rounded-md hover:bg-accent">
                  <RadioGroupItem value={e.id} id={`normal-${e.id}`} />
                  <div className="grid gap-1.5">
                    <Label htmlFor={`normal-${e.id}`} className="font-medium">
                      {e.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">{e.description}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-start space-x-2 p-2 rounded-md hover:bg-accent">
                <RadioGroupItem value="" id="normal-none" />
                <div className="grid gap-1.5">
                  <Label htmlFor="normal-none" className="font-medium">
                    Aucun
                  </Label>
                  <p className="text-sm text-muted-foreground">Désactiver les effets normaux</p>
                </div>
              </div>
            </RadioGroup>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 flex justify-end">
          <button 
            onClick={() => saveScreenConfig(config)}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Enregistrer
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterSettings;

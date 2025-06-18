import React, { useState } from "react";
import { Sun, Moon, Search, Mail, Info, AlertTriangle, Check, X, ChevronRight } from "lucide-react";

// Importer tous les composants UI
import {
  Button,
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Input,
  Select,
  Checkbox,
  Switch,
  Badge,
  Alert,
  Tooltip,
  Modal,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Dropdown, DropdownItem, DropdownDivider, DropdownHeader,
  Skeleton, SkeletonText, SkeletonAvatar, SkeletonButton, SkeletonCard,
  Avatar, AvatarGroup,
  Progress, ProgressIndeterminate,
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
  ThemeToggle
} from "../components/ui";

export default function DesignSystem() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [switchChecked, setSwitchChecked] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Système de Design Snapbooth</h1>
      
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      {/* Section Couleurs */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Couleurs</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Primaire</h3>
            <div className="space-y-2">
              <div className="h-10 rounded-md bg-primary-50 dark:bg-primary-900 p-2 text-xs text-primary-900 dark:text-primary-50">50/900</div>
              <div className="h-10 rounded-md bg-primary-100 dark:bg-primary-800 p-2 text-xs text-primary-900 dark:text-primary-100">100/800</div>
              <div className="h-10 rounded-md bg-primary-200 dark:bg-primary-700 p-2 text-xs text-primary-900 dark:text-primary-200">200/700</div>
              <div className="h-10 rounded-md bg-primary-300 dark:bg-primary-600 p-2 text-xs text-primary-900 dark:text-primary-50">300/600</div>
              <div className="h-10 rounded-md bg-primary-400 dark:bg-primary-500 p-2 text-xs text-white">400/500</div>
              <div className="h-10 rounded-md bg-primary-500 dark:bg-primary-400 p-2 text-xs text-white dark:text-primary-900">500/400</div>
              <div className="h-10 rounded-md bg-primary-600 dark:bg-primary-300 p-2 text-xs text-white dark:text-primary-900">600/300</div>
              <div className="h-10 rounded-md bg-primary-700 dark:bg-primary-200 p-2 text-xs text-white dark:text-primary-900">700/200</div>
              <div className="h-10 rounded-md bg-primary-800 dark:bg-primary-100 p-2 text-xs text-white dark:text-primary-900">800/100</div>
              <div className="h-10 rounded-md bg-primary-900 dark:bg-primary-50 p-2 text-xs text-white dark:text-primary-900">900/50</div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Secondaire</h3>
            <div className="space-y-2">
              <div className="h-10 rounded-md bg-secondary-50 dark:bg-secondary-900 p-2 text-xs text-secondary-900 dark:text-secondary-50">50/900</div>
              <div className="h-10 rounded-md bg-secondary-100 dark:bg-secondary-800 p-2 text-xs text-secondary-900 dark:text-secondary-100">100/800</div>
              <div className="h-10 rounded-md bg-secondary-200 dark:bg-secondary-700 p-2 text-xs text-secondary-900 dark:text-secondary-200">200/700</div>
              <div className="h-10 rounded-md bg-secondary-300 dark:bg-secondary-600 p-2 text-xs text-secondary-900 dark:text-secondary-50">300/600</div>
              <div className="h-10 rounded-md bg-secondary-400 dark:bg-secondary-500 p-2 text-xs text-white">400/500</div>
              <div className="h-10 rounded-md bg-secondary-500 dark:bg-secondary-400 p-2 text-xs text-white dark:text-secondary-900">500/400</div>
              <div className="h-10 rounded-md bg-secondary-600 dark:bg-secondary-300 p-2 text-xs text-white dark:text-secondary-900">600/300</div>
              <div className="h-10 rounded-md bg-secondary-700 dark:bg-secondary-200 p-2 text-xs text-white dark:text-secondary-900">700/200</div>
              <div className="h-10 rounded-md bg-secondary-800 dark:bg-secondary-100 p-2 text-xs text-white dark:text-secondary-900">800/100</div>
              <div className="h-10 rounded-md bg-secondary-900 dark:bg-secondary-50 p-2 text-xs text-white dark:text-secondary-900">900/50</div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Gris</h3>
            <div className="space-y-2">
              <div className="h-10 rounded-md bg-gray-50 dark:bg-gray-900 p-2 text-xs text-gray-900 dark:text-gray-50">50/900</div>
              <div className="h-10 rounded-md bg-gray-100 dark:bg-gray-800 p-2 text-xs text-gray-900 dark:text-gray-100">100/800</div>
              <div className="h-10 rounded-md bg-gray-200 dark:bg-gray-700 p-2 text-xs text-gray-900 dark:text-gray-200">200/700</div>
              <div className="h-10 rounded-md bg-gray-300 dark:bg-gray-600 p-2 text-xs text-gray-900 dark:text-gray-50">300/600</div>
              <div className="h-10 rounded-md bg-gray-400 dark:bg-gray-500 p-2 text-xs text-white">400/500</div>
              <div className="h-10 rounded-md bg-gray-500 dark:bg-gray-400 p-2 text-xs text-white dark:text-gray-900">500/400</div>
              <div className="h-10 rounded-md bg-gray-600 dark:bg-gray-300 p-2 text-xs text-white dark:text-gray-900">600/300</div>
              <div className="h-10 rounded-md bg-gray-700 dark:bg-gray-200 p-2 text-xs text-white dark:text-gray-900">700/200</div>
              <div className="h-10 rounded-md bg-gray-800 dark:bg-gray-100 p-2 text-xs text-white dark:text-gray-900">800/100</div>
              <div className="h-10 rounded-md bg-gray-900 dark:bg-gray-50 p-2 text-xs text-white dark:text-gray-900">900/50</div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">États</h3>
            <div className="space-y-2">
              <div className="h-10 rounded-md bg-green-500 p-2 text-xs text-white">Succès</div>
              <div className="h-10 rounded-md bg-red-500 p-2 text-xs text-white">Erreur</div>
              <div className="h-10 rounded-md bg-yellow-500 p-2 text-xs text-white">Avertissement</div>
              <div className="h-10 rounded-md bg-blue-500 p-2 text-xs text-white">Info</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Section Typographie */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Typographie</h2>
        <div className="space-y-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Titre h1</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">4xl / Bold</p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Titre h2</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">3xl / Bold</p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Titre h3</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">2xl / Semibold</p>
          </div>
          <div>
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white">Titre h4</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">xl / Semibold</p>
          </div>
          <div>
            <h5 className="text-lg font-medium text-gray-900 dark:text-white">Titre h5</h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">lg / Medium</p>
          </div>
          <div>
            <h6 className="text-base font-medium text-gray-900 dark:text-white">Titre h6</h6>
            <p className="text-sm text-gray-500 dark:text-gray-400">base / Medium</p>
          </div>
          <div>
            <p className="text-base text-gray-700 dark:text-gray-300">Paragraphe standard. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">base / Regular</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Texte petit. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">sm / Regular</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-500">Texte très petit. Lorem ipsum dolor sit amet.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">xs / Regular</p>
          </div>
        </div>
      </section>
      
      {/* Section Boutons */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Boutons</h2>
        
        <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">Variantes</h3>
        <div className="flex flex-wrap gap-4 mb-6">
          <Button variant="primary">Primaire</Button>
          <Button variant="secondary">Secondaire</Button>
          <Button variant="tertiary">Tertiaire</Button>
          <Button variant="outline">Contour</Button>
          <Button variant="ghost">Fantôme</Button>
          <Button variant="destructive">Destructif</Button>
        </div>
        
        <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">Tailles</h3>
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Button size="sm">Petit</Button>
          <Button size="md">Moyen</Button>
          <Button size="lg">Grand</Button>
        </div>
        
        <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">États</h3>
        <div className="flex flex-wrap gap-4 mb-6">
          <Button>Normal</Button>
          <Button disabled>Désactivé</Button>
          <Button variant="primary" icon={<Check className="w-4 h-4" />}>Avec icône</Button>
          <Button variant="outline" icon={<AlertTriangle className="w-4 h-4" />}>Alerte</Button>
        </div>
      </section>
      
      {/* Section Cartes */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Cartes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Titre de la carte</CardTitle>
              <CardDescription>Description de la carte avec plus de détails</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Contenu principal de la carte. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            </CardContent>
            <CardFooter>
              <Button variant="primary">Action principale</Button>
              <Button variant="outline" className="ml-2">Action secondaire</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <p>Carte simple sans en-tête ni pied de page. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Section Formulaires */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Formulaires</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Champ texte</label>
              <Input placeholder="Entrez votre texte" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Avec icône</label>
              <Input placeholder="Rechercher..." icon={<Search className="w-4 h-4" />} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Avec erreur</label>
              <Input placeholder="Email" error="Email invalide" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Désactivé</label>
              <Input placeholder="Non modifiable" disabled />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sélection</label>
              <Select 
                options={[
                  { value: 'option1', label: 'Option 1' },
                  { value: 'option2', label: 'Option 2' },
                  { value: 'option3', label: 'Option 3' }
                ]}
                placeholder="Choisissez une option"
              />
            </div>
            
            <div>
              <Checkbox 
                label="Accepter les conditions d'utilisation" 
                checked={checkboxChecked}
                onChange={() => setCheckboxChecked(!checkboxChecked)}
              />
            </div>
            
            <div>
              <Switch 
                checked={switchChecked} 
                onChange={setSwitchChecked}
                label="Activer les notifications"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Section Badges */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Badges</h2>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge>Défaut</Badge>
          <Badge variant="primary">Primaire</Badge>
          <Badge variant="secondary">Secondaire</Badge>
          <Badge variant="success">Succès</Badge>
          <Badge variant="warning">Avertissement</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="outline">Contour</Badge>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge size="sm">Petit</Badge>
          <Badge size="md">Moyen</Badge>
          <Badge size="lg">Grand</Badge>
        </div>
      </section>
      
      {/* Section Alertes */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Alertes</h2>
        
        <div className="space-y-4">
          <Alert variant="info" title="Information">
            Ceci est une alerte d'information. Elle contient des informations importantes.
          </Alert>
          
          <Alert variant="success" title="Succès">
            Opération réussie ! Vos modifications ont été enregistrées.
          </Alert>
          
          <Alert variant="warning" title="Avertissement">
            Attention ! Cette action pourrait avoir des conséquences importantes.
          </Alert>
          
          <Alert variant="error" title="Erreur" onClose={() => console.log('Alerte fermée')}>
            Une erreur s'est produite. Veuillez réessayer ultérieurement.
          </Alert>
        </div>
      </section>
      
      {/* Section Tooltips */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Tooltips</h2>
        
        <div className="flex flex-wrap gap-6 items-center">
          <Tooltip content="Tooltip au-dessus" position="top">
            <Button variant="outline">Au-dessus</Button>
          </Tooltip>
          
          <Tooltip content="Tooltip à droite" position="right">
            <Button variant="outline">À droite</Button>
          </Tooltip>
          
          <Tooltip content="Tooltip en dessous" position="bottom">
            <Button variant="outline">En dessous</Button>
          </Tooltip>
          
          <Tooltip content="Tooltip à gauche" position="left">
            <Button variant="outline">À gauche</Button>
          </Tooltip>
        </div>
      </section>
      
      {/* Section Modal */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Modal</h2>
        
        <Button onClick={() => setIsModalOpen(true)}>Ouvrir Modal</Button>
        
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Titre du Modal"
        >
          <p className="mb-4">Contenu du modal. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={() => setIsModalOpen(false)}>Confirmer</Button>
          </div>
        </Modal>
      </section>
      
      {/* Section Tabs */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Onglets</h2>
        
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Onglet 1</TabsTrigger>
            <TabsTrigger value="tab2">Onglet 2</TabsTrigger>
            <TabsTrigger value="tab3">Onglet 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <Card>
              <CardContent className="pt-6">
                <p>Contenu de l'onglet 1. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="tab2">
            <Card>
              <CardContent className="pt-6">
                <p>Contenu de l'onglet 2. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="tab3">
            <Card>
              <CardContent className="pt-6">
                <p>Contenu de l'onglet 3. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
      
      {/* Section Dropdown */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Dropdown</h2>
        
        <Dropdown
          trigger={
            <Button variant="outline" icon={<ChevronDown className="w-4 h-4 ml-2" />}>
              Menu
            </Button>
          }
        >
          <DropdownHeader>Actions</DropdownHeader>
          <DropdownItem onClick={() => console.log('Éditer')}>Éditer</DropdownItem>
          <DropdownItem onClick={() => console.log('Dupliquer')}>Dupliquer</DropdownItem>
          <DropdownDivider />
          <DropdownItem onClick={() => console.log('Archiver')}>Archiver</DropdownItem>
          <DropdownItem onClick={() => console.log('Supprimer')} className="text-red-600 dark:text-red-400">
            Supprimer
          </DropdownItem>
        </Dropdown>
      </section>
      
      {/* Section Skeleton */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Skeleton</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <SkeletonText lines={3} />
            <div className="flex items-center space-x-4">
              <SkeletonAvatar />
              <SkeletonText lines={2} className="flex-1" />
            </div>
            <div className="flex space-x-2">
              <SkeletonButton />
              <SkeletonButton />
            </div>
          </div>
          
          <SkeletonCard />
        </div>
      </section>
      
      {/* Section Avatar */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Avatar</h2>
        
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 items-center">
            <Avatar fallback="JD" />
            <Avatar src="https://i.pravatar.cc/150?img=1" alt="John Doe" />
            <Avatar src="https://i.pravatar.cc/150?img=2" alt="Jane Smith" status="online" />
            <Avatar src="https://i.pravatar.cc/150?img=3" alt="Bob Johnson" status="busy" />
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <Avatar size="xs" fallback="XS" />
            <Avatar size="sm" fallback="SM" />
            <Avatar size="md" fallback="MD" />
            <Avatar size="lg" fallback="LG" />
            <Avatar size="xl" fallback="XL" />
            <Avatar size="2xl" fallback="2X" />
          </div>
          
          <div>
            <AvatarGroup max={3}>
              <Avatar src="https://i.pravatar.cc/150?img=1" alt="User 1" />
              <Avatar src="https://i.pravatar.cc/150?img=2" alt="User 2" />
              <Avatar src="https://i.pravatar.cc/150?img=3" alt="User 3" />
              <Avatar src="https://i.pravatar.cc/150?img=4" alt="User 4" />
              <Avatar src="https://i.pravatar.cc/150?img=5" alt="User 5" />
            </AvatarGroup>
          </div>
        </div>
      </section>
      
      {/* Section Progress */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Progress</h2>
        
        <div className="space-y-6">
          <Progress value={30} max={100} label="Progression basique" showValue />
          
          <Progress value={60} max={100} variant="success" label="Progression réussie" showValue />
          
          <Progress value={80} max={100} variant="warning" label="Progression avec avertissement" showValue />
          
          <ProgressIndeterminate label="Chargement en cours..." />
        </div>
      </section>
      
      {/* Section Accordion */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Accordion</h2>
        
        <Accordion defaultExpanded={["item1"]}>
          <AccordionItem id="item1">
            <AccordionTrigger>Qu'est-ce que Snapbooth ?</AccordionTrigger>
            <AccordionContent>
              Snapbooth est une application de photobooth moderne qui permet de prendre des photos avec différents effets et de les partager instantanément.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem id="item2">
            <AccordionTrigger>Comment utiliser Snapbooth ?</AccordionTrigger>
            <AccordionContent>
              Il suffit de sélectionner un effet, de prendre une photo et de la partager via QR code ou par email.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem id="item3">
            <AccordionTrigger>Quels types d'effets sont disponibles ?</AccordionTrigger>
            <AccordionContent>
              Snapbooth propose une variété d'effets comme des filtres cartoon, des effets de dessin, des caricatures et bien plus encore.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  );
}
